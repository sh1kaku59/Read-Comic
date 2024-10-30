const sql = require('mssql');
const {getDbCollection, beginTransaction, commitTransaction, rollbackTransaction} = require('./ConnectToServer.js');

// Hàm cập nhật thông tin khách hàng
async function updateKhachhangById(username, tenkh, ngaysinh, gioitinh, avatar, color) {
    const dbRequest = await getDbCollection();

    // Kiểm tra xem khách hàng đã có thông tin chưa
    const checkQuery = `SELECT * FROM khachhang WHERE taikhoan = @username`;
    dbRequest.input('username', sql.NVarChar, username);
    const result = await dbRequest.query(checkQuery);

    if (result.recordset.length === 0) {
        // Nếu chưa có thông tin, thêm mới
        const insertQuery = `INSERT INTO khachhang (tenkh, ngaysinh, gioitinh, taikhoan, avatar) VALUES (@tenkh, @ngaysinh, @gioitinh, @username, @avatar)`;
        dbRequest.input('tenkh', sql.NVarChar, tenkh || null); // Chấp nhận NULL
        dbRequest.input('ngaysinh', sql.Date, ngaysinh || null); // Chấp nhận NULL
        dbRequest.input('gioitinh', sql.NVarChar, gioitinh || null); // Chấp nhận NULL
        dbRequest.input('avatar', sql.NVarChar, avatar || null); // Chấp nhận NULL
        //dbRequest.input('color', sql.NVarChar, color || null); // Chấp nhận NULL
        await dbRequest.query(insertQuery);
        return { success: true, message: 'Thêm thông tin khách hàng thành công.' };
    } else {
        // Nếu đã có thông tin, cập nhật
        let updateQuery = 'UPDATE khachhang SET ';
        const updateFields = [];

        if (tenkh !== null && tenkh !== '') {
            updateFields.push('tenkh = @tenkh');
        }
        if (ngaysinh !== null) {
            updateFields.push('ngaysinh = @ngaysinh');
        }
        if (gioitinh !== null && gioitinh !== '') {
            updateFields.push('gioitinh = @gioitinh');
        }
        if (avatar !== null && avatar !== '') {
            updateFields.push('avatar = @avatar');
        }
        if (color !== null && color !== '') {
            updateFields.push('color = @color');
        }

        // Nếu không có gì thay đổi, trả về kết quả ngay
        if (updateFields.length === 0) {
            return { success: true, message: 'Không có thay đổi để cập nhật.' };
        }

        // Gộp các trường cần cập nhật
        updateQuery += updateFields.join(', ') + ' WHERE taikhoan = @username';

        const updateRequest = await getDbCollection();

        try {
            if (tenkh !== null && tenkh !== '') {
                updateRequest.input('tenkh', sql.NVarChar, tenkh);
            }
            if (ngaysinh !== null) {
                updateRequest.input('ngaysinh', sql.Date, ngaysinh);
            }
            if (gioitinh !== null && gioitinh !== '') {
                updateRequest.input('gioitinh', sql.NVarChar, gioitinh);
            }
            if (avatar !== null && avatar !== '') {
                updateRequest.input('avatar', sql.NVarChar, avatar);
            }
            if (color !== null && color !== '') {
                updateRequest.input('color', sql.NVarChar, color);
            }
            updateRequest.input('username', sql.NVarChar, username);

            await updateRequest.query(updateQuery);
            return { success: true, message: 'Cập nhật thông tin khách hàng thành công.' };
        } catch (error) {
            console.error('Error updating khachhang:', error);
            throw error;
        }
    }
}

// Hàm kiểm tra và thay đổi mật khẩu
async function changePassword(username, currentPassword, newPassword) {
    try {
        const dbRequest = await getDbCollection();

        // 1. Lấy mật khẩu đã mã hóa từ cơ sở dữ liệu
        const userQuery = `SELECT matkhau FROM taikhoan WHERE tentk = @username`;
        dbRequest.input('username', sql.NVarChar, username);
        const result = await dbRequest.query(userQuery);

        // Kiểm tra xem tài khoản có tồn tại không
        if (result.recordset.length === 0) {
            return { success: false, message: 'Tài khoản không tồn tại.' };
        }

        //const storedHashedPassword = result.recordset[0].matkhau;
        const storedPassword = result.recordset[0].matkhau;

        // 2. So sánh mật khẩu hiện tại người dùng nhập với mật khẩu trong cơ sở dữ liệu
        //const isPasswordCorrect = await bcrypt.compare(currentPassword, storedHashedPassword);
        //if (!isPasswordCorrect) {
            //return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
        //}

        // So sánh mật khẩu hiện tại (không mã hóa)
        if (currentPassword !== storedPassword) {
            //return res.status(401).json({ message: 'Mật khẩu hiện tại không chính xác.' });
            return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
        }

        // Kiểm tra xem mật khẩu mới có giống với mật khẩu hiện tại không
        if (newPassword === currentPassword) {
            return { success: false, message: 'Mật khẩu mới không được giống với mật khẩu hiện tại.' };
        }

        // 3. Mã hóa mật khẩu mới
        //const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 4. Cập nhật mật khẩu mới trong cơ sở dữ liệu
        const updateQuery = `UPDATE taikhoan SET matkhau = @newPassword WHERE tentk = @username`;
        dbRequest.input('newPassword', sql.NVarChar, newPassword);
        await dbRequest.query(updateQuery);

        return { success: true, message: 'Mật khẩu đã được thay đổi thành công.' };

    } catch (error) {
        console.error('Lỗi khi thay đổi mật khẩu:', error);
        return { success: false, message: 'Có lỗi xảy ra khi thay đổi mật khẩu.' };
    }
}

// Hàm xóa tài khoản và thông tin khách hàng
async function deleteAccountAndCustomer(username) {
    const dbRequest = await getDbCollection();
    const transaction = await beginTransaction(); // Bắt đầu giao dịch

    try {
        // Xóa thông tin khách hàng
        const deleteCustomerQuery = `DELETE FROM khachhang WHERE taikhoan = @username`;
        dbRequest.input('username', sql.NVarChar, username);
        await dbRequest.query(deleteCustomerQuery);

        // Xóa tài khoản
        const deleteAccountQuery = `DELETE FROM taikhoan WHERE tentk = @username`;
        await dbRequest.query(deleteAccountQuery);

        // Commit transaction
        await commitTransaction(transaction);
        return { success: true, message: 'Tài khoản đã được hủy thành công.' };
        
    } catch (error) {
        await rollbackTransaction(transaction); // Rollback nếu có lỗi
        console.error('Error deleting account and customer:', error);
        throw error;
    }
}

// Hàm upload truyện
async function uploadComics(comicTitle, comicAuthor, comicCategory, comicStatus, comicDescription, comicImage) {
    if (!comicTitle || !comicAuthor || !comicDescription || !comicImage) {
        throw new Error('Thiếu thông tin cần thiết.');
    }

    try {
        const dbRequest = await getDbCollection();
        const query = `
            INSERT INTO truyen (tentruyen, tacgia, trangthai, iddanhmuc, hinhanh, mota, ngaycapnhat)
            VALUES (@comicTitle, @comicAuthor, @comicStatus, @comicCategory, @comicImage, @comicDescription, GETDATE())
        `;

        dbRequest.input('comicTitle', sql.NVarChar, comicTitle);
        dbRequest.input('comicAuthor', sql.NVarChar, comicAuthor);
        dbRequest.input('comicStatus', sql.NVarChar, comicStatus);
        dbRequest.input('comicCategory', sql.Int, comicCategory);
        dbRequest.input('comicImage', sql.NVarChar, comicImage);
        dbRequest.input('comicDescription', sql.NVarChar, comicDescription);

        await dbRequest.query(query); // Thực hiện truy vấn
        return { success: true, message: 'Upload truyện thành công!' };
    } catch (error) {
        console.error('Lỗi khi upload truyện tranh:', error);
        throw new Error('Có lỗi xảy ra khi upload truyện.');
    }
}

// Hàm Kiểm Tra và Tìm Kiếm 
async function findTruyen(searchTerm) {
    try {
        let query = `SELECT * FROM truyen WHERE 1=1`;

        if (searchTerm) {
            query += ` AND (tentruyen LIKE '%' + @search + '%' OR tacgia LIKE '%' + @search + '%')`;
        }

        const request = new sql.Request();
        if (searchTerm) {
            request.input('search', sql.NVarChar, searchTerm);
        }

        const result = await request.query(query);
        return result.recordset;
    } catch (err) {
        console.error('Error searching for stories:', err);
        throw new Error('Error searching for stories');
    }
}

// Hàm Sắp Xếp
async function sortStories(sortOption) {
    try {
        let query = `SELECT * FROM truyen ORDER BY `;

        switch (sortOption) {
            case 'nameAZ': // Sắp xếp tên từ A đến Z
                query += `tentruyen ASC`;
                break;
            case 'nameZA': // Sắp xếp tên từ Z đến A
                query += `tentruyen DESC`;
                break;
            case 'newest': // Mới nhất
                query += `ngaycapnhat DESC`;
                break;
            //case 'oldest': // Cũ nhất
                //query += `ngaycapnhat ASC`;
                //break;
            case 'status': // Sắp xếp theo trạng thái
                query += `trangthai ASC`;
                break;
            default:
                query += `ngaycapnhat DESC`; // Mặc định sắp xếp theo tên A đến Z
                break;
        }

        const result = await sql.query(query);
        return result.recordset;
    } catch (err) {
        console.error('Error sorting stories:', err);
        throw new Error('Error sorting stories');
    }
}

// Hàm Đăng Nhập Xác Thực Tài Khoản
async function loginUser(username, password) {
    try {
        const dbRequest = await getDbCollection();
        const query = `SELECT * FROM taikhoan WHERE tentk = @username AND matkhau = @password`;
        dbRequest.input('username', sql.NVarChar, username);
        dbRequest.input('password', sql.NVarChar, password);

        const result = await dbRequest.query(query);
        return result.recordset.length > 0;
    }catch (err) {
        console.error('Error in loginUser function:', err); // Ghi lỗi
        throw err; // Bắn lỗi để xử lý ở phần gọi hàm
    }
}

// Hàm Đăng Ký Tài Khoản
async function registerUser(username, password) {
    const dbRequest = await getDbCollection();
    const checkQuery = `SELECT * FROM taikhoan WHERE tentk = @username`;
    dbRequest.input('username', sql.NVarChar, username);

    const checkResult = await dbRequest.query(checkQuery);

    if (checkResult.recordset.length > 0) {
        return false; // Tài khoản đã tồn tại
    }

    const insertQuery = `INSERT INTO taikhoan (tentk, matkhau, loaitk) VALUES (@username, @password, 0)`;
    dbRequest.input('password', sql.NVarChar, password);
    await dbRequest.query(insertQuery);

    return true;
}

module.exports = {
    uploadComics,
    changePassword,
    updateKhachhangById,
    deleteAccountAndCustomer,
    findTruyen,
    sortStories,
    loginUser,
    registerUser
};

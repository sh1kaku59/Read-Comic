const express = require('express');
const app = express();
const path = require('path');
const {uploadComics, changePassword, resetPassword, updateKhachhangById, deleteAccountAndCustomer, loginUser, registerUser, findTruyen, sortStories, deleteComicById} = require('./public/javascripts/comic.js');
const sql = require('mssql');
const {connectToSQLServer, closeSQLServerConnection, getDbCollection} = require('./public/javascripts/ConnectToServer.js');
const port = 3000;
const multer  = require('multer');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const redisClient = createClient();
redisClient.connect().catch(console.error);

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: '09072002',  // Bạn nên sử dụng một khóa bí mật bảo mật cho session
    resave: false,
    saveUninitialized: true, // Chỉ lưu session khi có thay đổi
    cookie: { secure: false }  // Đặt thành true nếu sử dụng HTTPS
}));

process.on('SIGINT', () => {
    closeSQLServerConnection().then(() => {
        server.close(() => {
            console.log('Server đóng lưu');
            process.exit(0);
        });
    }).catch(err => {
        console.error('Lỗi khi đóng kết nối SQL Server:', err);
        process.exit(1);
    });
});

// Thêm middleware để xử lý dữ liệu JSON và URL-encoded trong body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

console.log(__dirname);
app.use(express.static(path.join(__dirname, 'public', 'img')));
app.use(express.static(path.join(__dirname, 'public', 'javascripts')));
app.use(express.static(path.join(__dirname, 'public', 'html')));
app.use(express.static(path.join(__dirname, 'public', 'css')));

app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname,'public', 'html', 'home.html');
    res.sendFile(htmlPath);
});

app.get('/Login', (req, res) => {
    const htmlPath = path.join(__dirname,'public', 'html', 'login-sigin.html');
    res.sendFile(htmlPath);
});

app.get('/Profile', (req, res) => {
    const htmlPath = path.join(__dirname,'public', 'html', 'profile.html');
    res.sendFile(htmlPath);
});

// Hàm Xử Lý Tải Hình Ảnh
function createUploader(folderPath) {
    const storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, path.join(__dirname, folderPath));
        },
        filename: function(req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname); // Tạo tên file không trùng
        }
    });
    return multer({ storage: storage });
}

// Xem danh sách tất cả truyện tranh
app.get('/api/comics', async (req, res) => {
    try {
        let sortOption = req.query.sortOption || 'ngaycapnhat';  // Mặc định sắp xếp theo ngày cập nhật
        let category = req.query.category || 'all';  // Mặc định là tất cả thể loại

        let query = `SELECT truyenid, tentruyen, tacgia, hinhanh, mota FROM truyen `;

        // Nếu category khác 'all', thêm điều kiện lọc
        if (category && category !== 'all') {
            query += ` WHERE iddanhmuc = @category`; // Sử dụng giá trị thể loại
        }

        // Xử lý sắp xếp
        switch (sortOption) {
            case 'nameAZ': // Sắp xếp theo tên từ A đến Z
                query += ` ORDER BY tentruyen ASC`; // Thêm khoảng trắng
                break;
            case 'nameZA': // Sắp xếp theo tên từ Z đến A
                query += ` ORDER BY tentruyen DESC`; // Thêm khoảng trắng
                break;
            case 'release': // Sắp xếp theo thời gian phát hành mới nhất
                query += ` ORDER BY ngaycapnhat DESC`; // Thêm khoảng trắng
                break;
            default:
                query += ` ORDER BY ngaycapnhat DESC`; // Mặc định sắp xếp theo ngày cập nhật
                break;
        }

        // Lấy đối tượng request để thực hiện truy vấn
        const dbRequest = await getDbCollection(); 
        
        // Khai báo biến @category
        if (category && category !== 'all') {
            dbRequest.input('category', sql.Int, parseInt(category)); // Đảm bảo là số
        }

        const result = await dbRequest.query(query); // Thực hiện truy vấn SQL để lấy tất cả truyện

        res.json(result.recordset);  // Trả về kết quả truy vấn
    } catch (err) {
        console.error('Lỗi khi lấy danh sách truyện:', err);
        res.status(500).send('Lỗi khi lấy danh sách truyện.');
    }
});

// Tìm kiếm người dùng theo tên truyện và tác giả
app.get('/api/search_comics', async (req, res) => {
    try {
        const { search } = req.query;
        const comics = await findTruyen(search);
        res.json(comics);
    } catch (err) {
        console.error('Error searching comics:', err);
        res.status(500).json({ message: 'Error searching comics' });
    }
});

// Sắp xếp người dùng theo các trường hợp
app.get('/api/sort_comics', async (req, res) => {
    try {
        const sortOption = req.query.sortOption;
        const sortedcomics = await sortStories(sortOption);
        res.json(sortedcomics);
    } catch (err) {
        console.error('Error sorting comics:', err);
        res.status(500).json({ error: 'Error sorting comics' });
    }
});

// Lọc theo thể loại
app.get('/api/categories', async (req, res) => {
    try {
        const dbRequest = await getDbCollection();
        const result = await dbRequest.query('SELECT tendanhmuc FROM danhmuc');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Lỗi khi lấy thể loại.');
    }
});

// Kiểm tra trạng thái đặng nhập/đăng ký
app.get('/api/check-login', (req, res) => {
    if (req.session.username) {
        res.json({ isLoggedIn: true, username: req.session.username });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// Đăng nhập
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const isAuthenticated = await loginUser(username, password);
        if (isAuthenticated) {
            req.session.username = username;  // Lưu username vào session
            res.status(200).send("Chào Mừng bạn đã đăng nhập thành công!");
        } else {
            res.status(401).send("Sai tài khoản hoặc mật khẩu.");
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Đã xảy ra lỗi khi đăng nhập.');
    }
});

// Đăng ký
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const isRegistered = await registerUser(username, password);
        if (isRegistered) {
            req.session.username = username;  // Lưu username vào session sau khi đăng ký thành công
            res.status(201).send("Đăng ký thành công!");
        } else {
            res.status(409).send("Tên tài khoản đã tồn tại.");
        }
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).send('Đã xảy ra lỗi khi đăng ký.');
    }
});

// Đăng xuất
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Có lỗi xảy ra khi đăng xuất.');
        }
        res.clearCookie('connect.sid'); // Xóa cookie phiên
        res.status(200).send('Bạn đã đăng xuất thành công.');
    });
});

// API để lấy thông tin khách hàng
app.get('/api/profile', async (req, res) => {
    const username = req.session.username; // Giả định bạn đã lưu thông tin tài khoản trong session

    if (!username) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    try {
        const dbRequest = await getDbCollection();
        const query = `SELECT tenkh, email, ngaysinh, gioitinh, avatar, color FROM khachhang WHERE taikhoan = @username`;
        dbRequest.input('username', sql.NVarChar, username);
        const result = await dbRequest.query(query);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Trả về thông tin khách hàng
        } else {
            res.json({ message: 'Không tìm thấy thông tin khách hàng.' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin khách hàng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi lấy thông tin khách hàng.' });
    }
});

// Khởi tạo upload file hình ảnh avatar
const uploadAvatar = createUploader('public/img');

// API để cập nhật thông tin khách hàng
app.post('/api/update-customer-profile', uploadAvatar.single('avatar'), async (req, res) => {
    const { tenkh, email, ngaysinh, gioitinh, color } = req.body;
    const username = req.session.username; // Giả định người dùng đã đăng nhập và username được lưu trong session
    const avatar = req.file ? req.file.filename : null; // Xử lý file avatar
    
    // Kiểm tra các giá trị có hợp lệ không trước khi cập nhật
    const Tenkh = tenkh && tenkh.trim() !== '' ? tenkh : null;
    const Email = email && email.trim() !== '' ? email : null;
    const Ngaysinh = ngaysinh && ngaysinh.trim() !== '' ? ngaysinh : null;
    const Gioitinh = gioitinh && gioitinh.trim() !== '' ? gioitinh : null;
    const Color = color && color.trim() !== '' ? color : null;

    console.log('Received data:', { Tenkh, Email, Ngaysinh, Gioitinh, avatar, Color });

    if (!username) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    try {
        const result = await updateKhachhangById(username, Tenkh, Email, Ngaysinh, Gioitinh, avatar, Color);
        res.json(result);
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin khách hàng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi cập nhật thông tin.' });
    }
});

// API Đổi Mật Khẩu
app.post('/api/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const username = req.session.username; // Giả định người dùng đã đăng nhập và username được lưu trong session

    if (!username) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    try {
        // Gọi hàm changePassword để xử lý việc đổi mật khẩu
        const result = await changePassword(username, currentPassword, newPassword);

        if (result.success) {
            res.json({ message: result.message });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        console.error('Error in password change:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi thay đổi mật khẩu.' });
    }
});

// API Gửi Mail Đổi Mật Khẩu
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
        const response = await resetPassword(email);
        res.json(response);
    } catch (error) {
        console.error('Error during forgot password process:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// API để hủy tài khoản
app.post('/api/delete-account', async (req, res) => {
    const username = req.session.username; // Lấy thông tin tài khoản từ session (người dùng hiện tại)

    if (!username) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    try {
        const result = await deleteAccountAndCustomer(username);
        req.session.destroy(); // Xóa session khi tài khoản đã bị hủy
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra khi hủy tài khoản.' });
    }
});

// Khởi tạo upload file hình ảnh comic
const uploadComic = createUploader('public/img');

// API để upload truyện tranh
app.post('/upload-comic', uploadComic.single('comicFile'), async (req, res) => {
    const username = req.session.username; // Giả định người dùng đã đăng nhập và username được lưu trong session
    const { comicTitle, comicAuthor, comicCategory, comicStatus, comicDescription } = req.body;
    const comicImage = req.file ? req.file.filename : null; // File ảnh truyện

    if (!username) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    if (!comicTitle || !comicAuthor || !comicDescription || !comicImage) {
        return res.status(400).json({ message: 'Thiếu thông tin cần thiết.' });
    }

    try {
        const result = await uploadComics(comicTitle, comicAuthor, comicCategory, comicStatus, comicDescription, comicImage);
        res.status(200).json({ message: result.message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ---------------------------------------------- Read Comic Of Huy ----------------------------------------- //
app.get('/:tenTruyen/:TenChap', (req, res, next) => {
    if (req.params.tenTruyen.startsWith('api')) {
        return next(); // Bỏ qua và để route khác xử lý
    }

    const tenTruyen = req.params.tenTruyen;
    const TenChap = req.params.TenChap;
    const filePath = path.join(__dirname, 'public', 'html', 'chapter.html');
    res.sendFile(filePath);
});

app.get('/:tenTruyen', (req, res) => {
    const tenTruyen = req.params.tentruyen;
    const filePath = path.join(__dirname, 'public', 'html', 'detail.html'); // Sử dụng path.join để xây dựng đường dẫn tệp
    res.sendFile(filePath);
});

// lấy thông tin chi tiết truyện 
app.get('/api/truyen/:tenTruyen', async (req, res) => {
    const { tenTruyen } = req.params;
    try {
        const result = await sql.query`
            SELECT t.truyenid, t.tentruyen, t.hinhanh, t.mota, t.danhgia, t.ngaycapnhat, c.chuongid, c.tieude, c.sochuong
            FROM truyen t
            LEFT JOIN chuong c ON t.truyenid = c.idtruyen
            WHERE t.tentruyen = ${tenTruyen}
            ORDER BY c.sochuong ASC
        `;

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching story details:', err);
        res.status(500).json({ error: 'Failed to fetch story details.' });
    }
});

// API lấy ảnh chương
app.get('/api/chap/:id/anh', async (req, res) => {
    const chapID = req.params.id;

    try {
        const result = await sql.query`SELECT * FROM hinhanh WHERE ChapID = ${chapID}`;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching anh chap:', err);
        res.status(500).send('Internal Server Error');
    }
});

// API lấy bình luận cho truyện
app.get('/api/binhluan', async (req, res) => {
    const { truyenId } = req.params;

    try {
        const result = await sql.query`SELECT * FROM binhluan WHERE idtruyen = ${truyenId}`;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).send('Error fetching comments');
    }
});

//---------------------------------------------- Admin ----------------------------------------------//
// API add comic
app.post('/api/admin/add-comic', uploadComic.single('comicFile'), async (req, res) => {
    const { comicTitle, comicAuthor, comicCategory, comicStatus, comicDescription } = req.body;
    const comicImage = req.file ? req.file.filename : null;

    if (!comicTitle || !comicAuthor || !comicDescription || !comicImage) {
        return res.status(400).json({ message: 'Thiếu thông tin cần thiết.' });
    }

    try {
        const result = await uploadComics(
            comicTitle,
            comicAuthor,
            comicCategory,
            comicStatus,
            comicDescription,
            comicImage
        );

        res.status(200).json(result); // Return success message
    } catch (error) {
        console.error('Error adding comic:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi thêm truyện.' });
    }
});

// API delete comic
app.delete('/api/comics/:id', async (req, res) => {
    try {
        const comicId = parseInt(req.params.id, 10); // Parse ID from route parameter
        const success = await deleteComicById(comicId); // Call the delete function

        if (success) {
            res.status(200).json({ message: 'Comic deleted successfully' });
        } else {
            res.status(404).json({ error: 'Comic not found' });
        }
    } catch (error) {
        console.error('Error in DELETE /api/comics/:id:', error);
        res.status(500).json({ error: 'Failed to delete comic' });
    }
});

// API edit comic
app.put('/api/comics/:id', uploadComic.single('comicFile'), async (req, res) => {
    const { id } = req.params;
    const { comicTitle, comicAuthor, comicCategory, comicStatus, comicDescription, existingImagePath } = req.body;

    let imagePath = existingImagePath; // Default to the existing image path

    if (req.file) {
        imagePath = `${req.file.filename}`; // Use new file if uploaded
    }

    try {
        const dbRequest = await getDbCollection();
        const query = `
            UPDATE truyen
            SET tentruyen = @comicTitle,
                tacgia = @comicAuthor,
                iddanhmuc = @comicCategory,
                trangthai = @comicStatus,
                mota = @comicDescription,
                hinhanh = @imagePath
            WHERE truyenid = @id
        `;

        dbRequest.input('comicTitle', sql.NVarChar, comicTitle);
        dbRequest.input('comicAuthor', sql.NVarChar, comicAuthor);
        dbRequest.input('comicCategory', sql.Int, comicCategory);
        dbRequest.input('comicStatus', sql.NVarChar, comicStatus);
        dbRequest.input('comicDescription', sql.NVarChar, comicDescription);
        dbRequest.input('imagePath', sql.NVarChar, imagePath);
        dbRequest.input('id', sql.Int, id);

        const result = await dbRequest.query(query);
        console.log("Update result:", result);
        res.status(200).json({ message: 'Comic updated successfully' });
    } catch (error) {
        console.error('Error updating comic:', error);
        res.status(500).json({ error: 'Failed to update comic' });
    }
});

// API fetch episode
app.get('/api/comic/:comicId/episodes', async (req, res) => {
    const { comicId } = req.params;

    try {
        const dbRequest = await getDbCollection();
        const query = `
            SELECT chuongid, sochuong, tieude, ngaydang 
            FROM chuong
            WHERE idtruyen = @comicId
            ORDER BY sochuong ASC;  -- Sorting by chapter number
        `;

        dbRequest.input('comicId', sql.Int, comicId);
        const result = await dbRequest.query(query);
        
        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset); // Return the episodes
        } else {
            res.status(404).json({ message: 'No episodes found for this comic' });
        }
    } catch (error) {
        console.error('Error fetching episodes:', error);
        res.status(500).json({ error: 'Failed to fetch episodes' });
    }
});

// API add episode

// API delete episode
app.delete('/api/comic/:comicId/episode/:episodeId', async (req, res) => {
    const { comicId, episodeId } = req.params;

    try {
        const dbRequest = await getDbCollection();
        const query = `DELETE FROM chuong WHERE chuongid = @episodeId AND idtruyen = @comicId`;

        dbRequest.input('episodeId', sql.Int, episodeId);
        dbRequest.input('comicId', sql.Int, comicId);
        await dbRequest.query(query);

        res.status(200).json({ message: 'Episode deleted successfully' });
    } catch (error) {
        console.error('Error deleting episode:', error);
        res.status(500).json({ error: 'Failed to delete episode' });
    }
});

// API edit episode

// API fetch genre
app.get('/api/genres', async (req, res) => {
    try {
        const dbRequest = await getDbCollection();
        const query = 'SELECT id, tendm FROM danhmuc';
        const result = await dbRequest.query(query);

        res.status(200).json(result.recordset); // Send the list of genres as JSON
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ error: 'Failed to fetch genres' });
    }
});

// API add genre
app.post('/api/genres', async (req, res) => {
    const { tendm } = req.body;

    try {
        const dbRequest = await getDbCollection();
        const query = 'INSERT INTO danhmuc (tendm) VALUES (@tendm)';
        dbRequest.input('tendm', sql.NVarChar, tendm);
        await dbRequest.query(query);

        res.status(201).json({ message: 'Genre added successfully' });
    } catch (error) {
        console.error('Error adding genre:', error);
        res.status(500).json({ error: 'Failed to add genre' });
    }
});

// API edit genre
app.put('/api/genres/:id', async (req, res) => {
    const { id } = req.params;
    const { tendm } = req.body;

    try {
        const dbRequest = await getDbCollection();
        const query = 'UPDATE danhmuc SET tendm = @tendm WHERE id = @id';
        dbRequest.input('id', sql.Int, id);
        dbRequest.input('tendm', sql.NVarChar, tendm);
        await dbRequest.query(query);
        res.status(200).json({ message: 'Genre updated successfully' });
    } catch (error) {
        console.error('Error updating genre:', error);
        res.status(500).json({ error: 'Failed to update genre' });
    }
});

// API delete genre
app.delete('/api/genres/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const dbRequest = await getDbCollection();
        const query = 'DELETE FROM danhmuc WHERE id = @id';
        dbRequest.input('id', sql.Int, id);
        await dbRequest.query(query);
        res.status(200).json({ message: 'Genre deleted successfully' });
    } catch (error) {
        console.error('Error deleting genre:', error);
        res.status(500).json({ error: 'Failed to delete genre' });
    }
});

// API fetch user
app.get('/api/accounts', async (req, res) => {
    try {
        const dbRequest = await getDbCollection(); // Connect to DB
        const query = 'SELECT tentk FROM taikhoan'; // Fetch usernames
        const result = await dbRequest.query(query);

        res.status(200).json(result.recordset); // Send usernames as JSON
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// API delete user
app.delete('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    const pool = await sql.connect(); // Establish a connection pool
    const transaction = new sql.Transaction(pool); // Initialize transaction with the pool

    try {
        // Begin the transaction
        await transaction.begin();

        // Use the transaction object for each request
        const request = new sql.Request(transaction);

        // Delete from `khachhang` first due to foreign key constraint
        await request.input('username', sql.NVarChar, username)
                     .query('DELETE FROM khachhang WHERE taikhoan = @username');

        // Delete from `taikhoan` table
        await request.query('DELETE FROM taikhoan WHERE tentk = @username');

        // Commit transaction if successful
        await transaction.commit();
        res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        // Rollback the transaction on error
        await transaction.rollback();
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// API details user
app.get('/api/users/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const dbRequest = await getDbCollection();
        const query = `
            SELECT tenkh, ngaysinh, gioitinh, taikhoan, avatar
            FROM khachhang
            WHERE taikhoan = @username
        `;
        dbRequest.input('username', sql.NVarChar, username);
        const result = await dbRequest.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(result.recordset[0]); // Send user details as JSON
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

const server = app.listen(port, async () => {
    try {
        await connectToSQLServer();
        console.log('Connected to SQLServer successfully');
        console.log(`Server is running on port http://localhost:${port}`);
    } catch (err) {
        console.error('Failed to connect to SQLServer:', err);
        process.exit(1);  // Kết thúc chương trình nếu không kết nối được với SQL Server
    }
});

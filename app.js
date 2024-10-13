const express = require('express');
const app = express();
const path = require('path');
const {changePassword, updateKhachhangById, getCustomerInfoByUsername, createNewKhachhang, loginUser, registerUser, findTruyen, sortStories} = require('./public/javascripts/comic.js');
const sql = require('mssql');
const { connectToSQLServer, closeSQLServerConnection, getDbCollection} = require('./public/javascripts/ConnectToServer.js');
const port = 3000;
const multer  = require('multer');
const session = require('express-session');

app.use(session({
    secret: '09072002',  // Bạn nên sử dụng một khóa bí mật bảo mật cho session
    resave: false,
    saveUninitialized: true,
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

// Xem danh sách tất cả truyện tranh
app.get('/api/comics', async (req, res) => {
    try {
        let sortOption = req.query.sortOption || 'ngaycapnhat';  // Mặc định sắp xếp theo ngày cập nhật
        let category = req.query.category || 'all';  // Mặc định là tất cả thể loại

        let query = `SELECT tentruyen, tacgia, hinhanh FROM truyen `;

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
            case 'status': // Sắp xếp theo trạng thái
                query += ` ORDER BY trangthai ASC`; // Thêm khoảng trắng
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
            res.status(201).send("Đăng ký thành công!");
        } else {
            res.status(409).send("Tên tài khoản đã tồn tại.");
        }
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).send('Đã xảy ra lỗi khi đăng ký.');
    }
});

// API để lấy thông tin khách hàng
app.get('/api/profile', async (req, res) => {
    const username = req.session.username; // Giả định bạn đã lưu thông tin tài khoản trong session

    if (!username) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    try {
        const dbRequest = await getDbCollection();
        const query = `SELECT tenkh, ngaysinh, gioitinh, avatar FROM khachhang WHERE taikhoan = @username`;
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
const storage = multer.diskStorage({
    // Đường dẫn đến thư mục public/img
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, 'public/img'));
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);// Tạo tên file dựa trên thời gian để tránh trùng
    }
});
const upload = multer({ storage: storage });

// API để cập nhật thông tin khách hàng
app.post('/api/update-customer-profile', upload.single('avatar'), async (req, res) => {
    const { tenkh, ngaysinh, gioitinh } = req.body;
    const username = req.session.username; // Giả định người dùng đã đăng nhập và username được lưu trong session
    const avatar = req.file ? req.file.filename : null; // Xử lý file avatar
    
    // Kiểm tra các giá trị có hợp lệ không trước khi cập nhật
    const Tenkh = tenkh && tenkh.trim() !== '' ? tenkh : null;
    const Ngaysinh = ngaysinh && ngaysinh.trim() !== '' ? ngaysinh : null;
    const Gioitinh = gioitinh && gioitinh.trim() !== '' ? gioitinh : null;

    console.log('Received data:', { Tenkh, Ngaysinh, Gioitinh, avatar });

    if (!username) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    }

    try {
        const result = await updateKhachhangById(username, Tenkh, Ngaysinh, Gioitinh, avatar);
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

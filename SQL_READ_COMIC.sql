-- tài khoản --
create table taikhoan(
    tentk nvarchar(100) primary key,
    matkhau nvarchar(100) not null,
    loaitk int not null -- 0: khách hàng// 1: admin
);

-- khách hàng --
create table khachhang(
    id int identity primary key,
    tenkh nvarchar(100),
    ngaysinh date,
    gioitinh nvarchar(100),
    taikhoan nvarchar(100) not null,
    avatar nvarchar(100),
    foreign key (taikhoan) references taikhoan(tentk)
);

-- danh mục thể loại --
create table danhmuc(
    id int identity primary key,
    tendm nvarchar(100) not null
);

-- truyện --
create table truyen(
    id int identity primary key,
    tentruyen nvarchar(100) not null,
    tacgia nvarchar(100) not null,
    trangthai nvarchar(100) not null, -- đang viết hay hoành thành --
    ngaycapnhat date not null default getdate(),
    hinhanh nvarchar(1000) not null,
    iddanhmuc int not null,
    mota nvarchar(1000) not null,
    danhgia float default 0,
    foreign key (iddanhmuc) references danhmuc(id)
);

-- chương truyện --
create table chuong(
    id int identity primary key,
    sochuong int not null,
    tieude nvarchar(100) not null,
    ngaydang date not null default getdate(),
    idtruyen int not null,
    foreign key (idtruyen) references truyen(id)
);

-- bình luận --
create table binhluan(
    id int identity primary key,
    noidung nvarchar(Max),
    idnd int not null, -- chua bang nguoi dung an --
    ngayvagio datetime not null default getdate(), -- lưu ngày và giờ bình luận --
    idtruyen int not null,
    idkh int not null,
    foreign key (idtruyen) references truyen(id),
    foreign key (idkh) references khachhang(id)
);

-- đánh giá sao --
create table danhgia(
    id int identity primary key,
    sosao int check(sosao between 1 and 10),
    ngaydanhgia date not null default getdate(),
    idtruyen int not null,
    idkh int not null,
    foreign key (idtruyen) references truyen(id),
    foreign key (idkh) references khachhang(id)
);

-- lịch sử đọc truyện --
create table lichsu(
    id int identity primary key,
    ngayvagio datetime not null default getdate(), -- ngày và giờ đã đọc lưu trữ lại để tiếp tục đọc
    idtruyen int not null,
    idchuong int not null,
    idkh int not null,
    foreign key (idtruyen) references truyen(id),
    foreign key (idchuong) references chuong(id),
    foreign key (idkh) references khachhang(id)
);

-- Ảnh Chương --
CREATE TABLE hinhanh(
    AnhID INT PRIMARY KEY IDENTITY(1,1),
    ChapID INT FOREIGN KEY REFERENCES Chuong(id),
    LinkAnh NVARCHAR(1000) NOT NULL,
    ThuTu INT NOT NULL -- Để sắp xếp thứ tự trang
);
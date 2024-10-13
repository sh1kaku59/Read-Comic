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
link nvarchar(4000) not null,
iddanhmuc int not null,
mota nvarchar(1000) not null,
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
noidung nvarchar(500) not null,
ngayvagio datetime not null default getdate(), -- lưu ngày và giờ bình luận --
idtruyen int not null,
idkh int not null,
foreign key (idtruyen) references truyen(id),
foreign key (idkh) references khachhang(id)
);

-- đánh giá sao --
create table danhgia(
id int identity primary key,
saodanhgia int not null,
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

-- nhập dữ liệu tài khoản --
insert into taikhoan(tentk, matkhau, loaitk) values('shiki','202cb962ac59075b964b07152d234b70', 0);
delete from taikhoan where tentk ='shiki';

-- nhập dữ liệu danh mục --
insert into danhmuc(tendm) values('bí ẩn và hành động'),('lãng mạng'),('hành động'),('phiêu lưu'),('hài hước');
select * from danhmuc;

-- nhập dữ liệu truyện --
insert into truyen(tentruyen,tacgia,trangthai,ngaycapnhat,iddanhmuc,hinhanh,link) values
('Jujutsu Kaisen','Gege AKUTAMI','hoàn thành', GETDATE(), 2, 'jujutsu_kaisen.jpg','https://www.viz.com/shonenjump/chapters/jujutsu-kaisen'),
('Thám Tử Conan','Gosho Aoyama','hoành thành', GETDATE(), 5, 'conan.jpg','https://nettruyenx.com/truyen-tranh/tham-tu-conan'),
('kimetsu no yaiba','Koyoharu Gotouge','hoành thành', GETDATE(), 4, 'kimetsu_no_yaiba.jpg','https://ww8.demonslayermanga.com/'),
('One Piece','Eiichirô Oda','hoành thành', GETDATE(), 1, 'onepiece.jpg','https://w13.read-onepiece-manga.com/'),
('Naruto','Masashi Kishimoto','hoành thành', GETDATE(), 1, 'naruto.png','https://nettruyenviet.com/truyen-tranh/naruto'),
('Doraemon','Fujio F. Fujiko','hoành thành', GETDATE(), 1, 'doraemon.jpg','https://nhasachmienphi.com/truyen-tranh-doremon.html');

-- Nhập dữ liệu khách hàng --
insert into khachhang(tenkh, ngaysinh, gioitinh, taikhoan, avatar) values('huydoctruyen', '2004-08-18', 'Nam', 'huyvt', null),
('vungocminh', '2002-07-09', 'Nam', 'shikaku', 'shikaku.jpg');
-- nhập dữ liệu tài khoản --
insert into taikhoan(tentk, matkhau, loaitk) values('shiki','202cb962ac59075b964b07152d234b70', 0);

select * from khachhang;
select * from taikhoan;
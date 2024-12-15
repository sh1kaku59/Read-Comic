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
    email NVARCHAR(100),
    color NVARCHAR(100)
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
    id nvarchar identity primary key,
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
    sosao float,
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

-- nhập dữ liệu tài khoản --
insert into taikhoan(tentk, matkhau, loaitk) values('admin','1', 1);
delete from taikhoan where tentk ='shiki';

-- nhập dữ liệu danh mục --
insert into danhmuc(tendm) values('thể thao'),('hành động kinh dị'),('bí ẩn và hành động'),('lãng mạng'),('hành động'),('phiêu lưu'),('hài hước');
select * from danhmuc;

-- nhập dữ liệu truyện --
insert into truyen(tentruyen,tacgia,trangthai,ngaycapnhat,iddanhmuc,hinhanh,link) values ('Chainsaw Man','Tatsuki Fujimoto','hoàn thành', GETDATE(), 6, 'chainsaw_man.jpg', 'https://chainsawmann.com'),
('Jujutsu Kaisen','Gege AKUTAMI','hoàn thành', GETDATE(), 2, 'jujutsu_kaisen.jpg','https://www.viz.com/shonenjump/chapters/jujutsu-kaisen'),
('Thám Tử Conan','Gosho Aoyama','hoành thành', GETDATE(), 5, 'conan.jpg','https://nettruyenx.com/truyen-tranh/tham-tu-conan'),
('kimetsu no yaiba','Koyoharu Gotouge','hoành thành', GETDATE(), 4, 'kimetsu_no_yaiba.jpg','https://ww8.demonslayermanga.com/'),
('One Piece','Eiichirô Oda','hoành thành', GETDATE(), 1, 'onepiece.jpg','https://w13.read-onepiece-manga.com/'),
('Naruto','Masashi Kishimoto','hoành thành', GETDATE(), 1, 'naruto.png','https://nettruyenviet.com/truyen-tranh/naruto'),
('Doraemon','Fujio F. Fujiko','hoành thành', GETDATE(), 1, 'doraemon.jpg','https://nhasachmienphi.com/truyen-tranh-doremon.html');

select * from khachhang;
select * from taikhoan;
select * from truyen;
select * from binhluan;

ALTER TABLE khachhang 
ADD email NVARCHAR(100);
GO
ALTER TABLE khachhang 
ADD color NVARCHAR(100);
GO
ALTER TABLE khachhang
DROP COLUMN enail;

ALTER TABLE truyen
DROP COLUMN link;

UPDATE truyen
SET mota = 'One-Punch Man (Japanese: ワンパンマン, Hepburn: Wanpanman) is a Japanese superhero manga series created by One. It tells the story of Saitama, an independent superhero who, because he can defeat any opponent with a single punch due to having trained himself to his peak condition, grows bored from a lack of challenge, setting out to find powerful opponents, while making allies of other heroes as well. One wrote the original webcomic manga version in early 2009.'
WHERE id = 13;

alter table truyen
add danhgia float default 0;

alter table binhluan
drop COLUMN noidung
go 
SELECT * from binhluan
go
alter TABLE binhluan
ADD noidung NVARCHAR(max)
go 
ALTER table binhluan
add idnd int not null;
go
alter table danhgia
drop column saodanhgia
go 
select * from danhgia
go 
alter table danhgia
add sosao int CHECK(sosao between 1 and 10);

select * from chuong;

update chuong
set tieude = 'Sakura''s Decision!! (サクラの決意!!, Sakura no Ketsui!!)'
where id = 1;

exec sp_rename 'truyen.id', 'truyenid', 'column';
exec sp_rename 'chuong.id', 'chuongid', 'column';

TRUNCATE TABLE chuong;
TRUNCATE TABLE hinhanh;

insert into hinhanh(ChapID, LinkAnh, ThuTu) VALUES
(2, '001.jpg', 1),
(2, '002.jpg', 2),
(2, '003.jpg', 3),
(2, '004.jpg', 4),
(2, '005.jpg', 5),
(2, '006.jpg', 6),
(2, '007.jpg', 7),
(2, '008.jpg', 8),
(2, '009.jpg', 9),
(2, '010.jpg', 10),
(2, '011.jpg', 11),
(2, '012.jpg', 12),
(2, '013.jpg', 13),
(2, '014.jpg', 14),
(2, '015.jpg', 15),
(2, '016.jpg', 16),
(2, '017.jpg', 17),
(2, '018.jpg', 18),
(2, '019.jpg', 19),
(2, '020.jpg', 20),
(2, '021.jpg', 21),
(2, '022.jpg', 22),
(2, '023.jpg', 23),
(2, '024.jpg', 24);

select * from hinhanh;

DELETE FROM danhmuc WHERE id = 10;

select * from danhgia;

alter table danhgia
drop column sosao;

alter table danhgia
drop CONSTRAINT CK__danhgia__sosao__04E4BC85;

ALTER TABLE danhgia
add sosao FLOAT;

ALTER TABLE binhluan
DROP COLUMN idnd;

ALTER TABLE binhluan
ADD idnd NVARCHAR(MAX) NOT NULL;
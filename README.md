# Finance Manager

Web quản lý thu – chi cho shop handmade: ghi nhận tiền vào, tiền ra, theo dõi tổng thu, tổng chi và chênh lệch theo thời gian, theo loại và theo từng loại tiền tệ.

Giao diện là HTML/CSS/JS tĩnh, dữ liệu chạy trên trình duyệt. Repository có thiết kế PostgreSQL cho cùng mô hình thu – chi.

![Dashboard](docs/images/admin/01-dashboard.png)

## Chức năng chính

- Đăng nhập, đăng xuất, phân quyền theo vai trò trên giao diện
- Dashboard: tổng thu, tổng chi, chênh lệch, số giao dịch, biểu đồ, giao dịch gần đây
- Khoản thu: danh sách, thêm, sửa, xóa mềm, tìm kiếm, lọc, chọn chứng từ
- Khoản chi: cùng luồng, có thêm người nhận
- Báo cáo: tổng quan, theo ngày, theo tháng, theo loại thu, theo loại chi, xuất báo cáo (in)
- Import dữ liệu: chọn file Excel, xem trước, lịch sử trên giao diện
- Nhật ký hoạt động
- Người dùng (Admin)
- Hồ sơ cá nhân

## Vai trò

Có bốn vai trò. Menu và nút chỉ hiện khi có quyền.

| | Admin | Chủ shop | Nhân viên | Người xem |
|---|---|---|---|---|
| Dashboard | Có | Có | Có | Có |
| Xem thu / chi | Có | Có | Có | Có |
| Thêm thu / chi | Có | Có | Có | |
| Sửa thu / chi | Có | Có | Bản mình tạo | |
| Xóa mềm thu / chi | Có | Có | | |
| Import dữ liệu | Có | Có | Có | |
| Báo cáo | Có | Có | | Có |
| Nhật ký hoạt động | Có | Có | | |
| Người dùng | Có | | | |
| Hồ sơ cá nhân | Có | Có | Có | Có |

Tài khoản demo (mật khẩu `123456`):

- `admin@demo.local` — Admin
- `owner@demo.local` — Chủ shop
- `staff@demo.local` — Nhân viên
- `viewer@demo.local` — Người xem

![Đăng nhập](docs/images/chung/01-dang-nhap.png)

## Giao diện

Sau khi đăng nhập:

- Dashboard
- Khoản thu (danh sách, thêm, sửa)
- Khoản chi (danh sách, thêm, sửa)
- Báo cáo
- Import dữ liệu
- Nhật ký hoạt động
- Người dùng
- Hồ sơ cá nhân
- Trang 403 khi không đủ quyền

Ảnh theo từng vai trò:

- [chung](docs/images/chung/) — đăng nhập
- [admin](docs/images/admin/)
- [chu-shop](docs/images/chu-shop/)
- [nhan-vien](docs/images/nhan-vien/)
- [nguoi-xem](docs/images/nguoi-xem/)

Người xem — danh sách khoản thu (không nút thêm / sửa / xóa):

![Người xem — khoản thu](docs/images/nguoi-xem/02-khoan-thu.png)

Nhân viên — không có Báo cáo, Nhật ký, Người dùng trên menu:

![Nhân viên — Dashboard](docs/images/nhan-vien/01-dashboard.png)

## Dữ liệu

Thiết kế PostgreSQL (`database/shop_finance.sql`, `database/shop_finance.dbml`) gồm:

- người dùng
- loại thu, khoản thu
- loại chi, khoản chi
- chứng từ
- đợt import
- nhật ký

Số liệu trên giao diện lấy từ `frontend/js/data.js`. Báo cáo trên UI xem từng loại tiền (USD hoặc VND).


## Cấu trúc repository

```text
finance-manager/
  README.md
  frontend/          index.html, css/, js/
  docs/              tài liệu sản phẩm
  docs/images/       sơ đồ và ảnh UI
  database/          shop_finance.sql, shop_finance.dbml
  scripts/           serve.sh, serve.bat
```

## Tài liệu

- [Phạm vi](docs/01-scope.md)
- [Chức năng](docs/02-features.md)
- [Use case](docs/03-use-cases.md)
- [Kiến trúc thông tin](docs/04-information-architecture.md)
- [Mô hình dữ liệu](docs/05-data-model.md)
- [Sơ đồ ER](docs/DATABASE.md)
- [Tiêu chí chấp nhận](docs/06-acceptance-criteria.md)

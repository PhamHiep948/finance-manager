# Feature Catalog

Status chỉ dùng: `Implemented Mock` | `Designed` | `Partial` | `Not Started`.

| ID | Tên | V1 | Status |
|---|---|---|---|
| F01 | Authentication | Yes | Implemented Mock |
| F02 | Dashboard | Yes | Implemented Mock |
| F03 | Income Management | Yes | Implemented Mock |
| F04 | Expense Management | Yes | Implemented Mock |
| F05 | Reports | Yes | Implemented Mock |
| F06 | Excel Import | Yes | Partial (UI/mock; không parse file) |
| F07 | Attachments | Yes | Implemented Mock |
| F08 | Audit Log | Yes | Implemented Mock |
| F09 | User Management | Yes | Implemented Mock |
| F10 | Profile | Yes | Implemented Mock |

## F01 Authentication

Mock login, không JWT / OAuth.

- F01.1 Login
- F01.2 Logout
- F01.3 Session mock (`sessionStorage`; Remember me → `localStorage`)
- F01.4 Route guard
- F01.5 Role guard

## F02 Dashboard

Tổng thu, tổng chi, chênh lệch thu - chi, số giao dịch. Biểu đồ thu - chi theo thời gian (theo tháng có trong mock). Chi theo loại. Khoản thu / chi gần đây. Một loại tiền tệ mỗi lần xem.

## F03 Income Management

Xem danh sách, thêm, sửa, xóa mềm, tìm kiếm, lọc, chứng từ mock.

Trường: ngày, nội dung, loại thu, số tiền, tiền tệ, mã tham chiếu, nguồn (form = Nhập tay), ghi chú, file chứng từ.

## F04 Expense Management

Như F03, thêm người nhận.

## F05 Reports

Tổng quan, theo ngày, theo tháng, theo loại thu, theo loại chi. Tách currency. **Xuất báo cáo** (in mock). Không gọi “xuất hóa đơn”.

## F06 Excel Import

Import khoản thu hoặc khoản chi. File `.xlsx` / `.xls`. Preview mock, lịch sử import, success/error mock. **Không parse Excel thật.**

## F07 Attachment

`<input type="file">`. Hiển thị name, type, size. Không Base64, không server.

## F08 Audit

Mock: tạo, sửa, xóa mềm, import.

## F09 User Management

Chỉ Admin. Danh sách, thêm mock (kèm mật khẩu), đổi role, bật/tắt.

## F10 Profile

Xem; sửa tên / avatar URL mock. Không đổi email/password thật.

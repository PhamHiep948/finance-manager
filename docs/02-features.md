# Feature Catalog

Status chỉ dùng: `Implemented Mock` | `Designed` | `Partial` | `Not Started`.

Sản phẩm UI: **HandmadeFinance**.

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

Mock login, không JWT / OAuth. Màn hình 2 cột: giới thiệu HandmadeFinance + form.

- F01.1 Login (email, mật khẩu, ghi nhớ thiết bị)
- F01.2 Logout
- F01.3 Session mock (`sessionStorage`; Remember me → `localStorage`)
- F01.4 Route guard
- F01.5 Role guard
- F01.6 Quên mật khẩu / đăng ký: toast hướng dẫn (không luồng thật)

## F02 Dashboard

Tổng doanh thu, tổng chi phí, lợi nhuận ròng, số giao dịch. Biểu đồ thu–chi theo thời gian (lọc khoảng ngày). Doanh thu theo loại thu. Giao dịch gần đây. Đổi tiền xem USD / EUR trên cùng một bộ dữ liệu.

## F03 Income Management

Danh sách đủ cột (có thể ẩn/hiện cột), KPI tháng, lọc, phân trang, xóa mềm.

Thêm / sửa bằng **modal**. Xem chi tiết bằng **modal** (kênh bán, trạng thái, chứng từ, breakdown phí).

Trường: ngày, tên sản phẩm, loại thu, số tiền trước thuế (lưu USD), % thuế, tiền sau thuế, mã tham chiếu, mã đơn hàng, bán đi đâu, kênh bán, trạng thái hồ sơ, số lượng, đơn giá, Item total, Discount, Subtotal, Shipping, Tax, nguồn nhập (tay / Excel), ghi chú, chứng từ.

Mock mẫu: đơn Etsy `4154185113` (Lily Flower, 5 món, Đức / trong EU, 22.10 USD trước thuế).

## F04 Expense Management

Như F03. Thêm người nhận, phạm vi nguồn (nội địa / quốc tế), phương thức thanh toán, % thuế, tiền sau thuế (mặc định = số tiền × (1 + % thuế)).

## F05 Reports

Tổng quan, theo ngày, theo tháng, theo loại thu, theo loại chi. Đổi tiền USD/EUR lúc xem. **Xuất báo cáo** (in mock). Không gọi “xuất hóa đơn”.

## F06 Excel Import

Import khoản thu hoặc khoản chi. File `.xlsx` / `.xls`. Preview mock, lịch sử import, success/error mock. **Không parse Excel thật.**

## F07 Attachment

`<input type="file">` trên form. Modal chi tiết hiện tên file / ảnh minh họa. Không Base64, không server.

## F08 Audit

Mock: tạo, sửa, xóa mềm, import, đăng nhập (hiển thị trên bảng nhật ký). Cột: người dùng, hành động, module, chi tiết, thời gian.

## F09 User Management

Chỉ Admin. KPI số người / quản trị / hoạt động / ngừng kích hoạt. Danh sách, thêm, sửa (tên, email, mật khẩu, vai trò, trạng thái), bật/tắt.

## F10 Profile

Tab **Tài khoản** (họ tên, SĐT, avatar, email/chức vụ chỉ đọc), **Bảo mật** (đổi mật khẩu mock), **Vai trò & quyền hạn** (ma trận quyền, không tự đổi role).

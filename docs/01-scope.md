# Scope V1

Tên sản phẩm trên giao diện: **HandmadeFinance**.

## Problem

Shop handmade cần một nơi đơn giản để:

- ghi nhận tiền vào;
- ghi nhận tiền ra;
- biết tổng doanh thu, tổng chi phí, lợi nhuận ròng;
- xem dữ liệu theo thời gian;
- xem theo loại thu / loại chi.

Không phải ERP, không phải kế toán đầy đủ, không quản lý kho / SKU.

Khoản thu: tên sản phẩm, mã đơn, khu vực bán (trong EU / ngoài EU), số lượng, đơn giá, phí đơn (Item, Discount, Subtotal, Shipping, Tax), số tiền **trước thuế** và **sau thuế**, kênh bán (Etsy / website / Instagram / hội chợ / sỉ), trạng thái hồ sơ (nháp / chờ xử lý / hoàn thành).

Khoản chi: nội dung, người nhận, phạm vi nội địa / quốc tế, phương thức thanh toán, % thuế, trước thuế / sau thuế, trạng thái hồ sơ.

Người dùng: họ tên, email, số điện thoại, ảnh đại diện, vai trò, đang hoạt động / ngừng kích hoạt.

## Goals

V1 hỗ trợ:

- Đăng nhập mock (layout 2 cột HandmadeFinance).
- Dashboard (KPI, biểu đồ thu–chi, doanh thu theo loại, giao dịch gần đây).
- Quản lý khoản thu (bảng đủ cột, modal thêm/sửa, modal chi tiết).
- Quản lý khoản chi (cùng mô hình).
- Báo cáo & phân tích (một bộ số USD; đổi EUR lúc xem).
- Import dữ liệu Excel (mock).
- Chứng từ (metadata mock trên modal chi tiết).
- Nhật ký hoạt động (mock).
- Quản lý người dùng (Admin).
- Hồ sơ: tài khoản, đổi mật khẩu mock, ma trận quyền.
- Role / permission mock.
- PostgreSQL **data model / schema design** bám UI.

## Non-goals

V1 **không** làm:

- Quản lý kho, CRM, đơn hàng nhiều dòng SKU.
- Payroll chi tiết, BHXH, kế toán kép.
- Hóa đơn điện tử, payment gateway, Etsy API.
- AI, chatbot.
- Backend API.
- Authentication thật.
- Kết nối PostgreSQL với frontend.
- Parse Excel thật / upload file lên server.

## Current reality

| Thành phần | Sự thật |
|---|---|
| Frontend | **MOCK DATA** (`frontend/js/data.js`). Không `fetch` API, không SQL. |
| Database | **Schema designed** (`database/shop_finance.sql`, `.dbml`). Chưa gắn app. |
| Auth | **Mock authentication** (sessionStorage / localStorage). |
| Import Excel | **UI + mock flow**. Không đọc nội dung file. |
| Chứng từ | Chọn file trên máy, lưu **tên / type / size**. Không upload. |

Backend chưa triển khai.

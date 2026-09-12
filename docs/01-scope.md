# Scope V1

## Problem

Shop handmade cần một nơi đơn giản để:

- ghi nhận tiền vào;
- ghi nhận tiền ra;
- biết thu bao nhiêu;
- biết chi bao nhiêu;
- biết chênh lệch;
- xem dữ liệu theo thời gian;
- xem theo loại thu / loại chi.

Không phải ERP, không phải kế toán đầy đủ, không quản lý sản phẩm.

## Goals

V1 hỗ trợ:

- Đăng nhập mock.
- Dashboard.
- Quản lý khoản thu.
- Quản lý khoản chi.
- Báo cáo (tách theo tiền tệ).
- Import Excel ở mức mock.
- Chứng từ (metadata mock).
- Nhật ký hoạt động (mock).
- Quản lý người dùng mock.
- Hồ sơ cá nhân.
- Role / permission mock.
- PostgreSQL **data model / schema design**.

## Non-goals

V1 **không** làm:

- Quản lý sản phẩm, kho, CRM, đơn hàng chi tiết.
- Item total, discount, shipping, tax, coupon.
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

# C4 Model — HandmadeFinance

## Purpose

Bộ tài liệu này mô tả kiến trúc **HandmadeFinance** theo **C4 Model**.

Hiện có sơ đồ và trang mô tả:

| Level | Diagram | File ảnh | Trang mô tả |
| ----- | ------- | -------- | ----------- |
| C1 | System Context | [c1-system-context.jpg](c1-system-context.jpg) | [01-system-context.md](01-system-context.md) |
| C2 | Container (Target) | [c2-container.jpg](c2-container.jpg) | [02-container.md](02-container.md) |

Chưa bao gồm Level 3 Component và Level 4 Code.

## C1 — System Context

![C1 System Context](c1-system-context.jpg)

Bốn **Person** (Chủ shop, Admin, Nhân viên, Người xem) dùng **HandmadeFinance** ([Software System]). Không có hệ thống bên ngoài ở mức C1.

Chi tiết: [01-system-context.md](01-system-context.md)

## C2 — Container

![C2 Container](c2-container.jpg)

Bốn **Person** (Chủ shop, Admin, Nhân viên, Người xem) đứng ngoài system boundary. Bên trong: **Web Frontend** → REST/HTTPS/JSON → **Go Backend** → SQL → **PostgreSQL**.

Chi tiết: [02-container.md](02-container.md)

## Architecture status

- **C1 System Context:** Defined. Bốn vai trò người dùng, không có External Software System.
- **C2 Container:** Target Architecture. Go Backend là **Planned**, chưa có trong source.
- Frontend hiện chạy mock (`frontend/js/data.js`, `frontend/js/auth.js`), không gọi API, không nối Postgres lúc chạy.

## Current Architecture Decisions

1. Frontend remains a browser-based web application.
2. Backend target technology is Go.
3. PostgreSQL is the primary relational database.
4. Frontend must not connect directly to PostgreSQL.
5. Backend is designed initially as a modular monolith.
6. C4 documentation currently stops at Level 2.

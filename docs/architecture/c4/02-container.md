# C2 — Container

HandmadeFinance được cấu thành từ những application / data store cấp cao nào?

Luồng C4: [C1 System Context](01-system-context.md) → **C2** → [C3 Component](03-component.md)

Đây là bước 2: zoom vào Software System trên C1. Sơ đồ là **Target Architecture**. Go Backend **chưa có trong source**.

![C2 Container — HandmadeFinance](c2-container.jpg)

File ảnh: [c2-container.jpg](c2-container.jpg)

## Cách đọc sơ đồ

Người dùng (**Person**) nằm **ngoài** đường nét đứt. Đường nét đứt là **System Boundary** của HandmadeFinance.

Ba hình bên trong boundary là **Container**:

| Container | Type | Technology | Status |
| --------- | ---- | ---------- | ------ |
| Web Frontend | Web Application | React.js | Target |
| Go Backend | Backend Application | Go | Planned |
| PostgreSQL Database | Database | PostgreSQL | Designed (schema) |

Không vẽ trình duyệt thành một Container riêng.

## People

Bốn vai trò lấy từ `frontend/js/auth.js`. Trên sơ đồ, cả bốn người dùng hệ thống qua **Web Frontend**.

| Actor | Trên sơ đồ | Relationship tới Frontend |
| ----- | ---------- | ------------------------- |
| Chủ shop | Theo dõi và quản lý thu - chi | Quản lý và theo dõi thu - chi |
| Admin | Quản trị người dùng và hệ thống | Quản trị hệ thống và người dùng |
| Nhân viên | Ghi nhận giao dịch theo quyền | Ghi nhận giao dịch theo quyền |
| Người xem | Xem dữ liệu và báo cáo | Xem dữ liệu và báo cáo |

## Containers

### Web Frontend

| | |
|---|---|
| **Name** | Web Frontend |
| **Type** | Container: Web Application |
| **Technology** | React.js |
| **Status** | Target |
| **Description** | Giao diện người dùng HandmadeFinance (thu, chi, dashboard, báo cáo, import, người dùng, hồ sơ). |

### Go Backend

| | |
|---|---|
| **Name** | Go Backend |
| **Type** | Container: Backend Application |
| **Technology** | Go |
| **Status** | Planned / Target |
| **Description** | Cung cấp REST API, xác thực / phân quyền, xử lý nghiệp vụ và truy cập dữ liệu. |

**Chưa implement.** Source không có mã Go hay HTTP API.

### PostgreSQL Database

| | |
|---|---|
| **Name** | PostgreSQL Database |
| **Type** | Container: Database |
| **Technology** | PostgreSQL |
| **Status** | Designed (schema); chưa gắn runtime với ứng dụng |
| **Description** | Lưu người dùng, phân quyền, giao dịch thu - chi, danh mục, import và nhật ký hệ thống. |

Chi tiết bảng thuộc data model, không vẽ thành Container.

## Relationships (Target Architecture)

| Source | Destination | Relationship |
| ------ | ----------- | ------------ |
| Chủ shop, Admin, Nhân viên, Người xem | Web Frontend | Dùng hệ thống qua trình duyệt (mỗi vai trò một mối quan hệ trên sơ đồ) |
| Web Frontend | Go Backend | Gọi REST API / HTTPS / JSON |
| Go Backend | PostgreSQL Database | Đọc/ghi dữ liệu / SQL |

Frontend **không** truy cập PostgreSQL trực tiếp ở Target Architecture.

## Current State

Đã xác minh source: frontend mock chưa phải React; dữ liệu nằm trong JavaScript trên trình duyệt. C4 ghi **React.js** là công nghệ giao diện đích. Postgres schema tồn tại để thiết kế và có thể chạy độc lập qua Docker; app mock không dùng nó.

```text
Người dùng → Web Frontend ↔ mock JS (data.js, auth.js)
PostgreSQL: schema only, chưa nối app
Go Backend: chưa có
```

## Bước tiếp theo

Zoom vào Go Backend để xem các Component: [C3 — Component](03-component.md).

## Source of Truth

- Sơ đồ: `c2-container.jpg`
- `README.md` (repo)
- `docs/05-data-model.md`, `docs/DATABASE.md`
- `frontend/`
- `database/shop_finance.sql`
- `docker-compose.yml`

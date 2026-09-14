# C3 — Component

Go Backend được chia thành những **Component** nào?

Level này **zoom vào Container Go Backend** trên [C2](02-container.md). Web Frontend và PostgreSQL vẫn là Container (không tách component).

**Architecture status: Target.** Các component dưới đây là module Go dự kiến. Source hiện chưa có backend.

![C3 Component — Go Backend](c3-component.png)

File ảnh: [c3-component.png](c3-component.png)

Luồng C4: [C1](01-system-context.md) → [C2](02-container.md) → **C3**

## Cách đọc sơ đồ

Đường nét đứt tím = **Go Backend**. Bên trái: Web Frontend gọi HTTPS / REST / JSON. Bên phải: PostgreSQL nhận SQL.

Luồng request điển hình:

```text
Web Frontend
    → HTTP API & Routing
        → Identity & Access
        → module nghiệp vụ (User, Category, Income, Expense, Import, Dashboard)
            → Persistence / Data Access
                → PostgreSQL
```

Một số module còn gọi Category, Dashboard & Reporting, Audit Log (không đi tắt ra database).

## Neighbors (từ C2)

| Name | Type | Vai trò trên C3 |
| ---- | ---- | ---------------- |
| Web Frontend | Container: Web Application (React.js) | Gọi REST API |
| PostgreSQL Database | Container: Database | Lưu dữ liệu bền vững |

## Components (trong Go Backend)

| Component | Type | Description trên sơ đồ |
| --------- | ---- | ---------------------- |
| HTTP API & Routing | Go | Nhận REST/JSON request, route endpoint và chuyển đến component nghiệp vụ |
| Identity & Access | Go | Xác thực người dùng và kiểm tra role / quyền truy cập |
| User & Profile Management | Go | Quản lý tài khoản, trạng thái và hồ sơ người dùng |
| Category Management | Go | Quản lý danh mục thu và chi dùng trong giao dịch |
| Income Management | Go | Quản lý vòng đời khoản thu và các quy tắc nghiệp vụ liên quan |
| Expense Management | Go | Quản lý vòng đời khoản chi và các quy tắc nghiệp vụ liên quan |
| Excel Import | Go | Kiểm tra, preview và tạo giao dịch từ dữ liệu Excel hợp lệ |
| Dashboard & Reporting | Go | Tổng hợp số liệu và cung cấp dữ liệu cho dashboard, báo cáo |
| Audit Log | Go | Ghi nhận các thao tác quan trọng để phục vụ truy vết |
| Persistence / Data Access | Go / SQL | Đóng gói truy vấn SQL, transaction và truy cập PostgreSQL |

Ánh xạ UI hiện tại (frontend) → component đích:

| Màn hình / module UI | Component C3 |
| -------------------- | ------------ |
| Đăng nhập, phân quyền nút | Identity & Access |
| Người dùng, hồ sơ | User & Profile Management |
| Loại thu / loại chi | Category Management |
| Quản lý khoản thu | Income Management |
| Quản lý khoản chi | Expense Management |
| Import Excel | Excel Import |
| Dashboard, báo cáo | Dashboard & Reporting |
| Nhật ký hoạt động | Audit Log |

## Relationships

### Vào / ra Container

| Source | Destination | Relationship |
| ------ | ----------- | ------------ |
| Web Frontend | HTTP API & Routing | HTTPS / REST / JSON |
| Persistence / Data Access | PostgreSQL Database | SQL / PostgreSQL Protocol |

### HTTP API tới nghiệp vụ

| Source | Destination | Relationship |
| ------ | ----------- | ------------ |
| HTTP API & Routing | Identity & Access | Xác thực / phân quyền |
| HTTP API & Routing | User & Profile Management | Người dùng / hồ sơ |
| HTTP API & Routing | Income Management | Nghiệp vụ thu |
| HTTP API & Routing | Expense Management | Nghiệp vụ chi |
| HTTP API & Routing | Excel Import | Import Excel |
| HTTP API & Routing | Category Management | Danh mục |
| HTTP API & Routing | Dashboard & Reporting | Dashboard / báo cáo |

### Nghiệp vụ tới nhau

| Source | Destination | Relationship |
| ------ | ----------- | ------------ |
| Income Management | Category Management | Dùng danh mục thu |
| Expense Management | Category Management | Dùng danh mục chi |
| Excel Import | Income Management | Tạo khoản thu |
| Excel Import | Expense Management | Ghi thao tác |
| Income Management | Dashboard & Reporting | Ghi thao tác |
| Expense Management | Dashboard & Reporting | Ghi thao tác |
| Excel Import | Dashboard & Reporting | Gửi kết quả import |
| User & Profile Management | Audit Log | Ghi thao tác quản trị |
| Income / Expense / Excel Import | Audit Log | Ghi thao tác |

### Tới Persistence

Identity, User & Profile, Category, Income, Expense, Excel Import, Dashboard & Reporting, Audit Log đều đi **Persistence / Data Access** (đọc tài khoản/quyền, đọc/ghi giao dịch, đọc dữ liệu tổng hợp, lưu audit log). Không component nghiệp vụ nào nối thẳng PostgreSQL.

## Current State

Trong source, logic tương ứng nằm ở JavaScript trình duyệt (`frontend/js/auth.js`, `frontend/js/data.js`, `frontend/js/views.js`). C3 mô tả chỗ các trách nhiệm đó sẽ ngồi khi có Go Backend.

## Source of Truth

- Sơ đồ: `c3-component.png`
- Level trước: [02-container.md](02-container.md)
- `frontend/js/auth.js`, `frontend/js/data.js`, `frontend/js/views.js`
- `docs/02-features.md`, `docs/03-use-cases.md`
- `database/shop_finance.sql`

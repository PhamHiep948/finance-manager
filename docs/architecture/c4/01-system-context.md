# C1 — System Context

HandmadeFinance nằm trong bối cảnh nào, ai sử dụng nó, và ranh giới hệ thống ở đâu?

Luồng C4: **C1** → [C2 Container](02-container.md) → [C3 Component](03-component.md)

Đây là bước 1: nhìn hệ thống từ bên ngoài, chưa nói công nghệ.

![C1 System Context — HandmadeFinance](c1-system-context.jpg)

File ảnh: [c1-system-context.jpg](c1-system-context.jpg)

## Cách đọc sơ đồ

Một **Software System** ở giữa. Bốn **Person** đứng xung quanh, mỗi người một mối quan hệ vào hệ thống.

Không có **External Software System** ở mức C1.

## System

| | |
|---|---|
| **Name** | HandmadeFinance |
| **Type** | Software System |
| **Description** | Hệ thống quản lý thu - chi cho shop handmade, theo dõi doanh thu, chi phí, chênh lệch thu - chi và báo cáo tài chính. |

**Inside HandmadeFinance:** đăng nhập, dashboard, khoản thu/chi, danh mục, báo cáo, import dữ liệu, nhật ký, người dùng, hồ sơ, phân quyền theo vai trò.

**Outside:** bốn vai trò người dùng; quy trình cửa hàng thủ công ngoài phần mềm; hệ thống bên thứ ba không thuộc V1 (ERP, kho SKU, cổng thanh toán, API sàn).

## People

Bốn vai trò lấy từ `frontend/js/auth.js` (`ADMIN`, `SHOP_OWNER`, `EMPLOYEE`, `VIEWER`).

| Actor | Trên sơ đồ | Relationship tới HandmadeFinance |
| ----- | ---------- | -------------------------------- |
| Chủ shop | Quản lý và theo dõi hoạt động thu - chi của cửa hàng | Quản lý và theo dõi thu - chi |
| Admin | Quản trị người dùng và các chức năng quản trị hệ thống | Quản trị hệ thống và người dùng |
| Nhân viên | Thực hiện nghiệp vụ thu - chi theo quyền được cấp | Ghi nhận giao dịch theo quyền |
| Người xem | Xem dữ liệu và báo cáo theo quyền truy cập | Xem dữ liệu và báo cáo |

## External Systems

No external software systems are currently required at the System Context level.

Requirement V1 không dùng cổng thanh toán hay API sàn.

## Bước tiếp theo

Zoom vào HandmadeFinance để xem các Container: [C2 — Container](02-container.md).

## Source of Truth

- Sơ đồ: `c1-system-context.jpg`
- `README.md` (repo)
- `docs/01-scope.md`
- `docs/02-features.md`
- `docs/03-use-cases.md`
- `frontend/js/auth.js`
- `frontend/js/data.js`

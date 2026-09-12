# Actors, roles, use cases

Tên sản phẩm: **Finance Manager**.

## Actors / roles

| Role | Tên hiển thị |
|---|---|
| `ADMIN` | Admin |
| `SHOP_OWNER` | Chủ shop |
| `EMPLOYEE` | Nhân viên |
| `VIEWER` | Người xem |

Không thêm role khác.

## Role × feature matrix

| Chức năng | Admin | Chủ shop | Nhân viên | Người xem |
|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Xem khoản thu | ✓ | ✓ | ✓ | ✓ |
| Thêm khoản thu | ✓ | ✓ | ✓ | |
| Sửa khoản thu | ✓ | ✓ | của mình | |
| Xóa mềm khoản thu | ✓ | ✓ | | |
| Xem khoản chi | ✓ | ✓ | ✓ | ✓ |
| Thêm khoản chi | ✓ | ✓ | ✓ | |
| Sửa khoản chi | ✓ | ✓ | của mình | |
| Xóa mềm khoản chi | ✓ | ✓ | | |
| Import dữ liệu | ✓ | ✓ | ✓ | |
| Xem báo cáo | ✓ | ✓ | | ✓ |
| Xuất báo cáo | ✓ | ✓ | | ✓ |
| Nhật ký hoạt động | ✓ | ✓ | | |
| Người dùng | ✓ | | | |
| Hồ sơ cá nhân | ✓ | ✓ | ✓ | ✓ |

Menu / nút **không hiển thị** nếu không có quyền.

## Sơ đồ tổng

```mermaid
flowchart TB
  Admin((Admin))
  Owner((Chủ shop))
  Staff((Nhân viên))
  Viewer((Người xem))

  Full["Thu/chi đầy đủ, import, báo cáo, nhật ký, user"]
  Biz["Thu/chi đầy đủ, import, báo cáo, nhật ký"]
  Input["Nhập thu/chi, import; sửa bản mình; không xóa / báo cáo / nhật ký / user"]
  Read["Chỉ đọc dashboard, list thu/chi, báo cáo"]

  Admin --> Full
  Owner --> Biz
  Staff --> Input
  Viewer --> Read
```

Cả bốn: đăng nhập, đăng xuất, dashboard, hồ sơ.

## Use cases

### UC01 Đăng nhập

- **Actor:** tất cả
- **Preconditions:** có tài khoản mock active
- **Main flow:** nhập email/mật khẩu → khớp mock user → lưu session → Dashboard
- **Alternative:** sai thông tin → báo lỗi, ở lại login
- **Permission:** public
- **Result:** mock session

### UC02 Đăng xuất

- **Actor:** tất cả
- **Preconditions:** đã login
- **Main flow:** xóa session → login
- **Permission:** authenticated
- **Result:** không còn vào trang nội bộ

### UC03 Xem Dashboard

- **Actor:** tất cả
- **Preconditions:** đã login
- **Main flow:** chọn tiền tệ → KPI + biểu đồ + giao dịch gần đây (bản ghi chưa xóa mềm)
- **Permission:** `dashboard`
- **Result:** số liệu một currency

### UC04 Xem khoản thu

- **Actor:** tất cả
- **Main flow:** list `deletedAt == null` + lọc
- **Permission:** `incomeRead`
- **Result:** Viewer không cột thao tác

### UC05 Thêm khoản thu

- **Actor:** Admin, Chủ shop, Nhân viên
- **Main flow:** form → validate → thêm mock, `source = MANUAL`, audit mock
- **Permission:** `incomeCreate`
- **Result:** xuất hiện trên list

### UC06 Sửa khoản thu

- **Actor:** Admin, Chủ shop; Nhân viên nếu `createdBy` = mình
- **Main flow:** form → cập nhật; nguồn vẫn MANUAL
- **Permission:** `incomeUpdate` (+ own cho employee)
- **Result:** list/audit cập nhật

### UC07 Xóa mềm khoản thu

- **Actor:** Admin, Chủ shop
- **Main flow:** confirm → `deletedAt`, `deletedBy`; không `splice`
- **Permission:** `incomeDelete`
- **Result:** biến mất list active; audit còn

### UC08–UC11 Khoản chi

Cùng mô hình UC04–UC07. Thêm người nhận. Permission `expense*`.

### UC12 Import dữ liệu

- **Actor:** Admin, Chủ shop, Nhân viên
- **Main flow:** chọn thu/chi → chọn `.xlsx`/`.xls` → preview mock → Import → loading → success/error mock + lịch sử
- **Permission:** `importData`
- **Result:** không đọc nội dung Excel thật

### UC13 Xem báo cáo

- **Actor:** Admin, Chủ shop, Người xem
- **Main flow:** lọc currency, khoảng ngày, loại (prefix `INCOME:` / `EXPENSE:`)
- **Permission:** `reportRead`
- **Result:** không cộng USD+VND. Employee → 403

### UC14 Xuất báo cáo

- **Actor:** Admin, Chủ shop, Người xem
- **Main flow:** in cửa sổ báo cáo theo bộ lọc hiện tại (mock)
- **Permission:** `reportRead`
- **Result:** không phải hóa đơn điện tử

### UC15 Xem nhật ký

- **Actor:** Admin, Chủ shop
- **Permission:** `auditRead`

### UC16 Quản lý người dùng

- **Actor:** Admin
- **Main flow:** list, popup thêm (tên, email, mật khẩu, role), đổi role, bật/tắt
- **Permission:** `userManagement`

### UC17 Hồ sơ cá nhân

- **Actor:** tất cả
- **Main flow:** xem; sửa tên/avatar mock
- **Permission:** authenticated

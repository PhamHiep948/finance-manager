# Use case — Finance Manager

Hệ thống: web thu – chi shop handmade (prototype mock, chưa backend).

## Actor

| Actor | Role |
|---|---|
| Quản trị | `ADMIN` |
| Chủ shop | `SHOP_OWNER` |
| Nhân viên | `EMPLOYEE` |
| Người xem | `VIEWER` |

## Sơ đồ tổng

Bốn actor, bốn nhóm việc — không vẽ 17 mũi tên chồng lên nhau.

```mermaid
flowchart TB
  Admin((Quản trị))
  Owner((Chủ shop))
  Staff((Nhân viên))
  Viewer((Người xem))

  Full["Toàn bộ: thu chi, import,<br/>báo cáo, nhật ký, user"]
  Biz["Thu chi, import,<br/>báo cáo, nhật ký<br/>Không quản lý user"]
  Input["Nhập thu/chi, import<br/>Sửa bản mình · không xóa<br/>Không báo cáo / nhật ký / user"]
  Read["Chỉ đọc: dashboard,<br/>list thu/chi, báo cáo, hóa đơn"]

  Admin --> Full
  Owner --> Biz
  Staff --> Input
  Viewer --> Read
```

Cả bốn đều: **đăng nhập, đăng xuất, dashboard, hồ sơ**.

### Ai được làm gì

| Use case | Admin | Chủ shop | Nhân viên | Người xem |
|---|:---:|:---:|:---:|:---:|
| UC01 Đăng nhập | ✓ | ✓ | ✓ | ✓ |
| UC02 Đăng xuất | ✓ | ✓ | ✓ | ✓ |
| UC03 Dashboard | ✓ | ✓ | ✓ | ✓ |
| UC04 Xem khoản thu | ✓ | ✓ | ✓ | ✓ |
| UC05 Thêm khoản thu | ✓ | ✓ | ✓ | |
| UC06 Sửa khoản thu | ✓ | ✓ | của mình | |
| UC07 Xóa khoản thu | ✓ | ✓ | | |
| UC08 Xem khoản chi | ✓ | ✓ | ✓ | ✓ |
| UC09 Thêm khoản chi | ✓ | ✓ | ✓ | |
| UC10 Sửa khoản chi | ✓ | ✓ | của mình | |
| UC11 Xóa khoản chi | ✓ | ✓ | | |
| UC12 Import Excel | ✓ | ✓ | ✓ | |
| UC13 Xem báo cáo | ✓ | ✓ | | ✓ |
| UC14 Xuất hóa đơn | ✓ | ✓ | | ✓ |
| UC15 Xem nhật ký | ✓ | ✓ | | |
| UC16 Quản lý user | ✓ | | | |
| UC17 Hồ sơ cá nhân | ✓ | ✓ | ✓ | ✓ |

## Sơ đồ từng vai

### Quản trị

```mermaid
flowchart LR
  A((Quản trị))
  A --> T[Thu: xem thêm sửa xóa]
  A --> C[Chi: xem thêm sửa xóa]
  A --> I[Import]
  A --> B[Báo cáo + hóa đơn]
  A --> N[Nhật ký]
  A --> U[Người dùng]
```

### Chủ shop

```mermaid
flowchart LR
  O((Chủ shop))
  O --> T[Thu: xem thêm sửa xóa]
  O --> C[Chi: xem thêm sửa xóa]
  O --> I[Import]
  O --> B[Báo cáo + hóa đơn]
  O --> N[Nhật ký]
```

### Nhân viên

```mermaid
flowchart LR
  E((Nhân viên))
  E --> T[Thu: xem thêm · sửa của mình]
  E --> C[Chi: xem thêm · sửa của mình]
  E --> I[Import]
```

### Người xem

```mermaid
flowchart LR
  V((Người xem))
  V --> R[Xem dashboard, thu, chi]
  V --> B[Báo cáo + xuất hóa đơn]
```

## Mô tả ngắn từng use case

| ID | Tên | Actor | Mô tả |
|---|---|---|---|
| UC01 | Đăng nhập | Tất cả | Email + mật khẩu mock. Sai → lỗi. Đúng → dashboard. |
| UC02 | Đăng xuất | Tất cả | Xóa session → login. |
| UC03 | Xem dashboard | Tất cả | KPI, biểu đồ, giao dịch gần đây theo 1 loại tiền. |
| UC04 | Xem khoản thu | Tất cả | List + lọc. Viewer không cột thao tác. |
| UC05 | Thêm khoản thu | Admin, Owner, Employee | Form; nguồn mặc định Nhập tay. |
| UC06 | Sửa khoản thu | Admin, Owner; Employee (của mình) | Form; lưu vẫn là Nhập tay. |
| UC07 | Xóa khoản thu | Admin, Owner | Confirm modal, xóa mềm (mock). |
| UC08 | Xem khoản chi | Tất cả | Như thu + người nhận. |
| UC09 | Thêm khoản chi | Admin, Owner, Employee | Form; nguồn Nhập tay. |
| UC10 | Sửa khoản chi | Admin, Owner; Employee (của mình) | Form. |
| UC11 | Xóa khoản chi | Admin, Owner | Confirm modal. |
| UC12 | Import Excel | Admin, Owner, Employee | Chọn thu/chi, chọn file, mock import. |
| UC13 | Xem báo cáo | Admin, Owner, Viewer | Tab + lọc tiền tệ/ngày. Employee không vào (403). |
| UC14 | Xuất hóa đơn | Admin, Owner, Viewer | In mock theo bộ lọc báo cáo. |
| UC15 | Xem nhật ký | Admin, Owner | Bảng audit mock. |
| UC16 | Quản lý người dùng | Admin | Thêm (popup + mật khẩu), role, bật/tắt. |
| UC17 | Hồ sơ cá nhân | Tất cả | Xem; sửa tên/avatar mock. |

Chưa đăng nhập mà vào trang nội bộ → **UC01**. Có login nhưng sai quyền → trang **403**.

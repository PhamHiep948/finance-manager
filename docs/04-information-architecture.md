# Information architecture

```text
HandmadeFinance
│
├── Public
│   └── Đăng nhập (layout 2 cột)
│
└── Authenticated (sidebar + topbar)
    ├── Dashboard
    ├── Quản lý khoản thu
    │   ├── Danh sách (bảng, lọc, cột, phân trang)
    │   ├── Modal thêm / sửa
    │   └── Modal chi tiết
    ├── Quản lý khoản chi
    │   ├── Danh sách
    │   ├── Modal thêm / sửa
    │   └── Modal chi tiết
    ├── Báo cáo & Phân tích
    │   ├── Tổng quan
    │   ├── Theo ngày
    │   ├── Theo tháng
    │   ├── Theo loại thu
    │   └── Theo loại chi
    ├── Import dữ liệu Excel
    ├── Nhật ký hoạt động
    ├── Quản lý người dùng
    ├── Hồ sơ cá nhân
    │   ├── Tài khoản
    │   ├── Bảo mật
    │   └── Vai trò & quyền hạn
    └── 403
```

Hash: `#/login` `#/dashboard` `#/incomes` `#/incomes/new` `#/incomes/edit/:id` `#/expenses` … `#/reports` `#/import` `#/audit` `#/users` `#/profile` `#/403`.

Form thu/chi mở **modal** trên trang danh sách (hash `/new` và `/edit/:id` vẫn được, rồi chuyển về list + mở modal).

Toolbar **Đổi tiền**: USD / EUR. Dữ liệu một bộ (USD); EUR chỉ quy đổi hiển thị.

## Quyền trang

| Trang | Ai vào |
|---|---|
| Dashboard, hồ sơ | tất cả role |
| Khoản thu / chi (xem) | tất cả |
| Thêm/sửa thu chi | theo matrix; employee sửa của mình |
| Báo cáo | ADMIN, SHOP_OWNER, VIEWER |
| Import dữ liệu Excel | ADMIN, SHOP_OWNER, EMPLOYEE |
| Nhật ký hoạt động | ADMIN, SHOP_OWNER |
| Người dùng | ADMIN only |
| Không quyền | `#/403` |

Mục không có quyền: **không render** trên sidebar.

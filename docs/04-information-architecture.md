# Information architecture

```text
Finance Manager
│
├── Public
│   └── Đăng nhập
│
└── Authenticated
    ├── Dashboard
    ├── Khoản thu
    │   ├── Danh sách
    │   ├── Thêm
    │   └── Sửa
    ├── Khoản chi
    │   ├── Danh sách
    │   ├── Thêm
    │   └── Sửa
    ├── Báo cáo
    │   ├── Tổng quan
    │   ├── Theo ngày
    │   ├── Theo tháng
    │   ├── Theo loại thu
    │   └── Theo loại chi
    ├── Import dữ liệu
    ├── Nhật ký hoạt động
    ├── Người dùng
    ├── Hồ sơ cá nhân
    └── 403
```

Hash: `#/login` `#/dashboard` `#/incomes` `#/incomes/new` `#/incomes/edit/:id` `#/expenses` … `#/reports` `#/import` `#/audit` `#/users` `#/profile` `#/403`.

## Quyền trang

| Trang | Ai vào |
|---|---|
| Dashboard, hồ sơ | tất cả role |
| Khoản thu / chi (xem) | tất cả |
| Thêm/sửa thu chi | theo matrix; employee sửa của mình |
| Báo cáo | ADMIN, SHOP_OWNER, VIEWER |
| Import dữ liệu | ADMIN, SHOP_OWNER, EMPLOYEE |
| Nhật ký hoạt động | ADMIN, SHOP_OWNER |
| Người dùng | ADMIN only |
| Không quyền | `#/403` |

Mục không có quyền: **không render** trên sidebar.

# Sơ đồ dữ liệu

Schema PostgreSQL `shop_finance` cho **Finance Manager**.

Giao diện dùng **dữ liệu giả** bám đúng mô hình này (bảng, loại thu/chi, tiền tệ, xóa mềm). Giao diện **không kết nối** PostgreSQL.

File thiết kế: [shop_finance.dbml](../database/shop_finance.dbml) · [shop_finance.sql](../database/shop_finance.sql) · [05-data-model.md](05-data-model.md)

Ảnh sơ đồ: [images/er.png](images/er.png)

![Sơ đồ dữ liệu](images/er.png)

## Quan hệ (bảng)

`app_users` tạo / thao tác các bảng còn lại. Mỗi khoản thu/chi thuộc một loại; chứng từ gắn đúng một khoản thu hoặc một khoản chi; import gắn vào khoản được nhập.

```text
app_users
  ├── income_categories  →  incomes  ──┐
  ├── expense_categories →  expenses ─┼─→  attachments
  ├── import_batches     →  incomes / expenses
  └── audit_logs
```

`updated_by` và `deleted_by` cũng trỏ `app_users` — không vẽ thêm.

## Enum

| Enum | Giá trị |
|---|---|
| `user_role` | ADMIN, SHOP_OWNER, EMPLOYEE, VIEWER |
| `data_source` | MANUAL, EXCEL_IMPORT |
| `import_type` | INCOME, EXPENSE |
| `import_status` | PENDING, PROCESSING, COMPLETED, FAILED |
| `audit_action` | INSERT, UPDATE, DELETE |

## View (tổng hợp báo cáo)

View không lưu dữ liệu. Đọc thu/chi còn hiệu lực và cộng theo ngày / tháng / loại, tách theo `currency_code`.

| View | Nguồn |
|---|---|
| `vw_income_active` | `incomes` (`deleted_at IS NULL`) |
| `vw_expense_active` | `expenses` (`deleted_at IS NULL`) |
| `vw_cashflow_daily` | thu + chi theo ngày |
| `vw_cashflow_monthly` | thu + chi theo tháng |
| `vw_income_by_category` | thu theo loại |
| `vw_expense_by_category` | chi theo loại |

Cột chi tiết: [shop_finance.sql](../database/shop_finance.sql), [05-data-model.md](05-data-model.md).

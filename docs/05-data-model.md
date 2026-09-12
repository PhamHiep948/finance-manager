# Data model (PostgreSQL schema design)

Mục tiêu: mô hình thu/chi cơ bản, schema `shop_finance`.

Giao diện mock **bám đúng schema này** (bảng, loại, tiền tệ, xóa mềm). Dữ liệu trên UI là **mock trong JavaScript**, không mở kết nối PostgreSQL từ trình duyệt.

Source of truth kèm: [shop_finance.dbml](../database/shop_finance.dbml), [shop_finance.sql](../database/shop_finance.sql), [DATABASE.md](DATABASE.md).

## Bảng

| Bảng | Việc |
|---|---|
| `app_users` | User, `user_role`, soft delete |
| `income_categories` | Loại thu |
| `incomes` | Một dòng = một khoản tiền vào. `amount` là số cuối. |
| `expense_categories` | Loại chi |
| `expenses` | Một dòng = một khoản tiền ra. `payee` = người nhận |
| `attachments` | Metadata chứng từ; đúng một `income_id` hoặc `expense_id` |
| `import_batches` | Lần import Excel |
| `audit_logs` | INSERT/UPDATE/DELETE (thiết kế trigger SQL) |

Không có bảng dashboard / reports / statistics.

## Soft delete

`deleted_at` (+ `deleted_by` trên incomes/expenses). List active: `deleted_at IS NULL`.

## Currency

`currency_code` CHAR 3. View cashflow **group by currency**. Không cộng USD+VND.

## Views (thiết kế báo cáo)

`vw_income_active`, `vw_expense_active`, `vw_cashflow_daily`, `vw_cashflow_monthly`, `vw_income_by_category`, `vw_expense_by_category`.

## Seed loại

Thu: Bán hàng, Thu khác.

Chi: Nguyên vật liệu, Bao bì / đóng gói, Vận chuyển, Quảng cáo, Phí dịch vụ, Lương nhân viên, Điện / nước / Internet, Thuê mặt bằng, Công cụ / thiết bị, Chi khác.

## Mapping mock JS

| JS | SQL |
|---|---|
| `name` / `email` | `full_name` / `email` |
| `categoryId` | `income_category_id` / `expense_category_id` |
| `currency` | `currency_code` |
| `recipient` | `payee` |
| `attachment` `{name,type,size}` | `attachments.original_name`, `mime_type`, `file_size_bytes` |

Frontend đọc **mock JS** (`frontend/js/data.js`), mapping cột như trên — không query view SQL lúc chạy.

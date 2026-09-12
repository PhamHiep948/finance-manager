# Acceptance criteria (V1 mock)

## AUTH-01 Mock login

Done when:

- 4 account demo login được.
- Sai mật khẩu có lỗi.
- Chưa login không vào app.
- Logout xóa session.
- Role sai → 403.
- Viewer không thấy thêm/sửa/xóa/import.

## INC-01 Create income mock

Done when:

- Mở form được.
- Required validate.
- Record vào mock, `source = MANUAL`.
- Amount đúng currency.
- Audit mock được tạo.

## EXP-01 Soft delete expense

Done when:

- Không `splice` mất object.
- `deletedAt` / `deletedBy` được set.
- Biến mất list active.
- Audit mock được tạo.

## RPT-01 Currency + category

Done when:

- Không cộng USD+VND.
- Filter loại dùng `INCOME:id` / `EXPENSE:id`.

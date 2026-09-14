# Acceptance criteria (V1 mock)

## AUTH-01 Mock login

Done when:

- 4 account demo login được trên màn hình HandmadeFinance.
- Sai mật khẩu có lỗi.
- Chưa login không vào app.
- Logout xóa session.
- Role sai → 403.
- Viewer không thấy thêm/sửa/xóa/import.

## INC-01 Create income mock

Done when:

- Mở modal thêm khoản thu được.
- Required validate.
- Record vào mock, `source = MANUAL`.
- Có thể nhập mã đơn, khu vực bán, số lượng, đơn giá, Item/Discount/Shipping/Tax, % thuế, trước thuế / sau thuế.
- Mock mẫu đơn Etsy `4154185113` (Lily Flower, 22.10 USD trước thuế).
- Amount lưu USD; form/list đổi EUR lúc xem.
- Audit mock được tạo.

## EXP-01 Soft delete expense

Done when:

- Không `splice` mất object.
- `deletedAt` / `deletedBy` được set.
- Biến mất list active.
- Audit mock được tạo.

## EXP-02 Origin + tax + payment

Done when:

- Chọn Nội địa hoặc Quốc tế.
- Có cột trước thuế, % thuế, sau thuế trên danh sách.
- Tiền sau thuế mặc định = số tiền × (1 + % thuế / 100).
- Modal chi tiết hiện phương thức thanh toán và trạng thái hồ sơ.

## USR-01 Profile

Done when:

- Tab tài khoản sửa được họ tên và số điện thoại (mock).
- Tab bảo mật đổi mật khẩu mock.
- Tab vai trò chỉ xem, không tự nâng quyền.

## RPT-01 Currency + category

Done when:

- Một bộ dữ liệu; Đổi tiền USD ↔ EUR không tách list.
- Filter loại dùng `INCOME:id` / `EXPENSE:id`.

const USERS = [
  { id: 1, name: "Admin", email: "admin@demo.local", password: "123456", role: "ADMIN", status: "active", avatar: "" },
  { id: 2, name: "Chủ shop", email: "owner@demo.local", password: "123456", role: "SHOP_OWNER", status: "active", avatar: "" },
  { id: 3, name: "Nhân viên", email: "staff@demo.local", password: "123456", role: "EMPLOYEE", status: "active", avatar: "" },
  { id: 4, name: "Người xem", email: "viewer@demo.local", password: "123456", role: "VIEWER", status: "active", avatar: "" },
];

const INCOME_CATEGORIES = [
  { id: 1, name: "Bán hàng" },
  { id: 2, name: "Thu khác" },
];

const EXPENSE_CATEGORIES = [
  { id: 1, name: "Nguyên vật liệu" },
  { id: 2, name: "Bao bì / đóng gói" },
  { id: 3, name: "Vận chuyển" },
  { id: 4, name: "Quảng cáo" },
  { id: 5, name: "Phí dịch vụ" },
  { id: 6, name: "Lương nhân viên" },
  { id: 7, name: "Điện / nước / Internet" },
  { id: 8, name: "Thuê mặt bằng" },
  { id: 9, name: "Công cụ / thiết bị" },
  { id: 10, name: "Chi khác" },
];

const INCOMES = [
  { id: 1, incomeDate: "2026-07-12", description: "Đơn hàng #ETS-8801", categoryId: 1, amount: 95, currency: "USD", referenceCode: "ETS-8801", source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-07-12T10:00:00.000Z", updatedAt: "2026-07-12T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 2, incomeDate: "2026-07-28", description: "Bán sỉ móc khóa (T7)", categoryId: 1, amount: 140, currency: "USD", referenceCode: "WH-07", source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-07-28T09:00:00.000Z", updatedAt: "2026-07-28T09:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 3, incomeDate: "2026-08-08", description: "Đơn hàng #ETS-8902", categoryId: 1, amount: 110, currency: "USD", referenceCode: "ETS-8902", source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-08-08T11:20:00.000Z", updatedAt: "2026-08-08T11:20:00.000Z", deletedAt: null, deletedBy: null },
  { id: 4, incomeDate: "2026-08-22", description: "Đơn web túi xách (T8)", categoryId: 1, amount: 175, currency: "USD", referenceCode: "WEB-175", source: "MANUAL", note: "", attachment: { name: "bill-web-175.pdf", type: "application/pdf", size: 48200 }, createdBy: 3, createdAt: "2026-08-22T14:00:00.000Z", updatedAt: "2026-08-22T14:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 5, incomeDate: "2026-09-08", description: "Hoàn phí vận chuyển", categoryId: 2, amount: 12.5, currency: "USD", referenceCode: "", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-08T08:30:00.000Z", updatedAt: "2026-09-08T08:30:00.000Z", deletedAt: null, deletedBy: null },
  { id: 6, incomeDate: "2026-09-10", description: "Đơn web túi xách", categoryId: 1, amount: 190, currency: "USD", referenceCode: "WEB-190", source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-09-10T10:00:00.000Z", updatedAt: "2026-09-10T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 7, incomeDate: "2026-09-12", description: "Bán sỉ móc khóa", categoryId: 1, amount: 150, currency: "USD", referenceCode: "WH-04", source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-09-12T09:15:00.000Z", updatedAt: "2026-09-12T09:15:00.000Z", deletedAt: null, deletedBy: null },
  { id: 8, incomeDate: "2026-09-14", description: "Đơn hàng #ETS-9012", categoryId: 1, amount: 120, currency: "USD", referenceCode: "ETS-9012", source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-14T16:40:00.000Z", updatedAt: "2026-09-14T16:40:00.000Z", deletedAt: null, deletedBy: null },
  { id: 9, incomeDate: "2026-09-15", description: "Đơn hàng #ETS-9011", categoryId: 1, amount: 85, currency: "USD", referenceCode: "ETS-9011", source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-15T14:02:00.000Z", updatedAt: "2026-09-15T14:02:00.000Z", deletedAt: null, deletedBy: null },
  { id: 10, incomeDate: "2026-07-20", description: "Bán tại hội chợ (T7)", categoryId: 1, amount: 1800000, currency: "VND", referenceCode: "HC-07", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-07-20T12:00:00.000Z", updatedAt: "2026-07-20T12:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 11, incomeDate: "2026-08-18", description: "Thu khác — hoàn cọc", categoryId: 2, amount: 350000, currency: "VND", referenceCode: "", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-08-18T09:00:00.000Z", updatedAt: "2026-08-18T09:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 12, incomeDate: "2026-09-10", description: "Bán tại hội chợ", categoryId: 1, amount: 2450000, currency: "VND", referenceCode: "HC-09", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-10T11:00:00.000Z", updatedAt: "2026-09-10T11:00:00.000Z", deletedAt: null, deletedBy: null },
];

const EXPENSES = [
  { id: 1, expenseDate: "2026-07-05", description: "Mua len thô (T7)", categoryId: 1, amount: 90, currency: "USD", recipient: "Yarn Shop", source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-07-05T10:00:00.000Z", updatedAt: "2026-07-05T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 2, expenseDate: "2026-07-18", description: "Quảng cáo Meta ads (T7)", categoryId: 4, amount: 80, currency: "USD", recipient: "Meta", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-07-18T13:00:00.000Z", updatedAt: "2026-07-18T13:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 3, expenseDate: "2026-08-04", description: "Hộp giấy carton (T8)", categoryId: 2, amount: 40, currency: "USD", recipient: "Xưởng bao bì", source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-08-04T09:30:00.000Z", updatedAt: "2026-08-04T09:30:00.000Z", deletedAt: null, deletedBy: null },
  { id: 4, expenseDate: "2026-08-19", description: "Phí vận chuyển quốc tế (T8)", categoryId: 3, amount: 98, currency: "USD", recipient: "DHL", source: "EXCEL_IMPORT", note: "", attachment: { name: "dhl-aug.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 22100 }, createdBy: 2, createdAt: "2026-08-19T15:00:00.000Z", updatedAt: "2026-08-19T15:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 5, expenseDate: "2026-09-08", description: "Quảng cáo Meta ads", categoryId: 4, amount: 120, currency: "USD", recipient: "Meta", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-08T10:00:00.000Z", updatedAt: "2026-09-08T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 6, expenseDate: "2026-09-10", description: "Phí dịch vụ Etsy tháng 8", categoryId: 5, amount: 78.5, currency: "USD", recipient: "Etsy", source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-10T16:02:00.000Z", updatedAt: "2026-09-10T16:02:00.000Z", deletedAt: null, deletedBy: null },
  { id: 7, expenseDate: "2026-09-12", description: "Phí vận chuyển quốc tế", categoryId: 3, amount: 115, currency: "USD", recipient: "DHL", source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-12T11:00:00.000Z", updatedAt: "2026-09-12T11:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 8, expenseDate: "2026-09-14", description: "Hộp giấy carton", categoryId: 2, amount: 45, currency: "USD", recipient: "Xưởng bao bì", source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-09-14T08:40:00.000Z", updatedAt: "2026-09-14T08:40:00.000Z", deletedAt: null, deletedBy: null },
  { id: 9, expenseDate: "2026-09-15", description: "Mua 20 cuộn len thô", categoryId: 1, amount: 180, currency: "USD", recipient: "Yarn Shop", source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-09-15T13:40:00.000Z", updatedAt: "2026-09-15T13:40:00.000Z", deletedAt: null, deletedBy: null },
  { id: 10, expenseDate: "2026-07-22", description: "Thuê gian hàng (T7)", categoryId: 8, amount: 350000, currency: "VND", recipient: "BTC hội chợ", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-07-22T09:00:00.000Z", updatedAt: "2026-07-22T09:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 11, expenseDate: "2026-08-12", description: "Điện / nước / Internet (T8)", categoryId: 7, amount: 280000, currency: "VND", recipient: "Nhà mạng", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-08-12T10:00:00.000Z", updatedAt: "2026-08-12T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 12, expenseDate: "2026-09-10", description: "Thuê gian hàng hội chợ", categoryId: 8, amount: 400000, currency: "VND", recipient: "BTC hội chợ", source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-10T12:00:00.000Z", updatedAt: "2026-09-10T12:00:00.000Z", deletedAt: null, deletedBy: null },
];

const IMPORTS = [
  { id: 1, fileName: "Import_DonHang_Etsy_T9.xlsx", type: "INCOME", status: "COMPLETED", totalRows: 48, successRows: 47, failedRows: 1, createdBy: 2, createdAt: "2026-09-11 10:20" },
  { id: 2, fileName: "ChiPhi_VanChuyen_Q3.xlsx", type: "EXPENSE", status: "COMPLETED", totalRows: 12, successRows: 12, failedRows: 0, createdBy: 2, createdAt: "2026-09-10 16:02" },
  { id: 3, fileName: "Import_Sai_Format.xlsx", type: "INCOME", status: "FAILED", totalRows: 32, successRows: 0, failedRows: 32, createdBy: 3, createdAt: "2026-09-09 09:14" },
];

const AUDIT_LOGS = [
  { id: 1, time: "2026-09-15 14:02", userId: 2, action: "Tạo khoản thu", target: "Khoản thu", detail: "Đơn hàng #ETS-9011 · 85 USD" },
  { id: 2, time: "2026-09-15 13:40", userId: 3, action: "Tạo khoản chi", target: "Khoản chi", detail: "Mua 20 cuộn len thô · 180 USD" },
  { id: 3, time: "2026-09-14 09:12", userId: 2, action: "Sửa khoản thu", target: "Khoản thu", detail: "Cập nhật mô tả WEB-190" },
  { id: 4, time: "2026-09-11 10:21", userId: 2, action: "Import dữ liệu", target: "Import", detail: "Import_DonHang_Etsy_T9.xlsx · 47 thành công" },
  { id: 5, time: "2026-09-10 18:00", userId: 2, action: "Xóa khoản thu", target: "Khoản thu", detail: "Xóa mềm khoản thu #0 (mẫu audit)" },
];

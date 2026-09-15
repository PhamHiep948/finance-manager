/** Presentation-only mock for screenshot fidelity. Swap with API later. */
export const UI_MOCK = {
  displayName: "Nguyễn Handmade",
  roleLine: "Quản trị viên",
  kpis: {
    revenue: "42,500,000 đ",
    expense: "18,200,000 đ",
    profit: "24,300,000 đ",
    balance: "85,600,000 đ",
    dRev: "+12.5%",
    dExp: "-5.2%",
    dProfit: "+18.4%",
    dBal: "-2.1%",
  },
  months: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6"],
  cashflow: {
    income: [18, 24, 22, 32, 38, 42.5],
    expense: [12, 16, 18, 21, 19, 18.2],
  },
  groups: [
    { name: "Đồ gốm", amount: 13400000, color: "#0071e3", pct: 33 },
    { name: "Đan lát", amount: 12100000, color: "#1d7a4c", pct: 30 },
    { name: "Trang sức", amount: 8300000, color: "#9a6700", pct: 21 },
    { name: "Quà tặng", amount: 6300000, color: "#2b93f0", pct: 16 },
  ],
  recentTx: [
    { code: "TX001", text: "Bán bộ ấm trà xanh cổ vịt", time: "Hôm nay, 14:20", amount: 1200000, type: "in", status: "done" },
    { code: "TX002", text: "Mua nguyên liệu đất sét nhập khẩu", time: "Hôm nay, 10:15", amount: -1350000, type: "out", status: "pending" },
    { code: "TX003", text: "Hợp đồng quà tặng doanh nghiệp", time: "Hôm qua, 16:45", amount: 8500000, type: "in", status: "done" },
    { code: "TX004", text: "Thanh toán phí vận chuyển đơn hàng", time: "12/06/2024", amount: -450000, type: "out", status: "done" },
    { code: "TX005", text: "Bán gỗ mây tre đan xuất khẩu", time: "11/06/2024", amount: 2800000, type: "in", status: "done" },
  ],
  incomeKpis: [
    { label: "Tổng doanh thu (tháng)", value: "$12,450.80", delta: "+12.5% so với tháng trước" },
    { label: "Đơn hàng mới", value: "48", delta: "+5 so với tháng trước" },
    { label: "Doanh thu trung bình", value: "$259.40", delta: "-2.1% so với tháng trước" },
    { label: "Thị trường châu Âu", value: "€3,840.00", delta: "+8.4% so với tháng trước" },
  ],
  expenseKpis: [
    { label: "Tổng chi phí (tháng)", value: "$4,280.00", delta: "+4.1% so với tháng trước" },
    { label: "Giao dịch", value: "36", delta: "+3 so với tháng trước" },
    { label: "Chi phí quốc tế", value: "$0.00", delta: "0.0% tổng chi phí tháng" },
    { label: "Thuế & phí ước tính", value: "$312.45", delta: "VAT, thuế xuất khẩu, phí sàn" },
  ],
  reportKpis: [
    { label: "Tổng doanh thu", value: "109,500,000 đ", delta: "+14.2%", up: true, icon: "bar-chart-3" },
    { label: "Lợi nhuận ròng", value: "47,200,000 đ", delta: "+8.5%", up: true, icon: "trending-up" },
    { label: "Chi phí vận hành", value: "62,300,000 đ", delta: "+3.1%", up: false, icon: "wallet" },
    { label: "Đơn hàng hoàn tất", value: "418", delta: "+12.4%", up: true, icon: "check-circle" },
  ],
  reportTrend: {
    income: [12.2, 13.4, 14.6, 16.8, 19.4, 21.6],
    expense: [8.4, 9.0, 9.3, 10.1, 11.0, 11.8],
  },
  donut: [
    { name: "Đồ Gốm", pct: 45, color: "#0071e3" },
    { name: "Đan Lát", pct: 25, color: "#1d7a4c" },
    { name: "Thêu Thùa", pct: 15, color: "#0058b8" },
    { name: "Trang Sức", pct: 15, color: "#9a6700" },
  ],
  products: [
    { name: "Bình gốm thủ công Men Lam", sold: 124, revenue: "18,600,000 đ", growth: "+12%" },
    { name: "Giỏ mây tre đan họa tiết", sold: 98, revenue: "7,350,000 đ", growth: "-5%" },
    { name: "Khăn trải bàn thêu tay", sold: 76, revenue: "11,400,000 đ", growth: "+2%" },
    { name: "Vòng tay đá phong thủy", sold: 65, revenue: "3,250,000 đ", growth: "+18%" },
    { name: "Nến thơm thảo dược tự nhiên", sold: 54, revenue: "2,700,000 đ", growth: "+8%" },
  ],
  files: [
    { title: "Báo cáo Doanh thu Q2 2024", date: "14/06/2024", type: "PDF", icon: "file-text" },
    { title: "Phân tích Chi phí Nguyên liệu", date: "10/06/2024", type: "EXCEL", icon: "file-spreadsheet" },
    { title: "Thống kê Kho hàng T5", date: "01/06/2024", type: "PDF", icon: "file-text" },
    { title: "Báo cáo Thuế Hộ kinh doanh", date: "28/05/2024", type: "EXCEL", icon: "file-spreadsheet" },
    { title: "Tổng kết Chương trình Sale Hè", date: "20/05/2024", type: "PDF", icon: "file-text" },
  ],
  auditKpis: [
    { label: "Tổng số log", value: "1,248", icon: "clock", tone: "blue" },
    { label: "Người dùng tích cực", value: "12", icon: "users", tone: "green" },
    { label: "Thao tác bảo mật", value: "24", icon: "shield", tone: "orange" },
    { label: "Cảnh báo lỗi", value: "3", icon: "alert-circle", tone: "red" },
  ],
  userKpis: [
    { label: "Tổng số", value: "12", icon: "users", tone: "blue" },
    { label: "Quản trị", value: "2", icon: "shield", tone: "indigo" },
    { label: "Hoạt động", value: "10", icon: "check-circle", tone: "green" },
    { label: "Ngừng kích hoạt", value: "2", icon: "power", tone: "orange" },
  ],
};

export const UI_USERS = [
  { id: 101, name: "Nguyễn Văn An", email: "an.nguyen@handmadeshop.vn", role: "ADMIN", status: "active", last: "2 phút trước", photo: "https://i.pravatar.cc/64?img=32" },
  { id: 102, name: "Trần Thị Bình", email: "binh.tran@handmadeshop.vn", role: "EMPLOYEE", status: "active", last: "1 giờ trước", photo: "https://i.pravatar.cc/64?img=47" },
  { id: 103, name: "Lê Hoàng Cường", email: "cuong.le@handmadeshop.vn", role: "VIEWER", status: "disabled", last: "3 ngày trước", photo: "https://i.pravatar.cc/64?img=12" },
  { id: 104, name: "Phạm Minh Đức", email: "duc.pham@handmadeshop.vn", role: "EMPLOYEE", status: "disabled", last: "Chưa từng", photo: "https://i.pravatar.cc/64?img=15" },
  { id: 105, name: "Vũ Thanh Hà", email: "ha.vu@handmadeshop.vn", role: "VIEWER", status: "active", last: "15 phút trước", photo: "https://i.pravatar.cc/64?img=49" },
];

export const UI_AUDIT = [
  { id: "LOG-001", user: "Nguyễn Handmade", role: "Quản trị viên", initial: "N", action: "login", module: "Hệ thống", detail: "Đăng nhập vào hệ thống từ trình", time: "08:30:15\n2024-05-20" },
  { id: "LOG-002", user: "Trần Thị Thu", role: "Nhân viên kế toán", initial: "T", action: "create", module: "Khoản thu", detail: "Tạo mới hóa đơn bán lẻ", time: "09:15:42\n2024-05-20" },
  { id: "LOG-003", user: "Lê Văn Nam", role: "Nhân viên kho", initial: "L", action: "update", module: "Khoản chi", detail: "Cập nhật trạng thái thanh toán cho", time: "10:05:11\n2024-05-20" },
  { id: "LOG-004", user: "Nguyễn Handmade", role: "Quản trị viên", initial: "N", action: "import", module: "Dữ liệu", detail: "Nhập dữ liệu từ tệp Excel", time: "11:20:33\n2024-05-20" },
  { id: "LOG-005", user: "Phạm Minh Đức", role: "Nhân viên bán hàng", initial: "P", action: "delete", module: "Khoản thu", detail: "Xóa giao dịch lỗi #TR-998 (Số tiền", time: "13:45:02\n2024-05-20" },
  { id: "LOG-006", user: "Trần Thị Thu", role: "Nhân viên kế toán", initial: "T", action: "export", module: "Báo cáo", detail: "Xuất báo cáo doanh thu tháng 4", time: "14:10:55\n2024-05-20" },
  { id: "LOG-007", user: "Hệ thống", role: "System", initial: "H", action: "update", module: "Bảo mật", detail: "Thất bại khi cố gắng truy cập trái", time: "15:30:11\n2024-05-20" },
  { id: "LOG-008", user: "Nguyễn Handmade", role: "Quản trị viên", initial: "N", action: "update", module: "Phân quyền", detail: "Thay đổi quyền hạn cho nhóm “Nhân", time: "16:05:44\n2024-05-20" },
];

export const INCOME_SOURCES_UI = ["Etsy Store", "Website Direct", "Instagram Shop", "Local Market", "B2B Wholesale"];
export const PAY_METHODS = ["Thẻ tín dụng", "Chuyển khoản", "Tiền mặt", "PayPal"];
export const AVATAR_ADMIN = "https://i.pravatar.cc/160?img=47";
export const IMG_HERO = "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1600&q=60";
export const IMG_IMPORT = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=60";
export const IMG_REPORT = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=640&q=60";
export const IMG_RECEIPT = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=70";

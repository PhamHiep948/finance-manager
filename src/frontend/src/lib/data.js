export const FX_USD_TO_EUR = 0.92;

export const USERS = [
  { id: 1, name: "Admin", email: "admin@demo.local", password: "123456", role: "ADMIN", status: "active", phone: "090 123 4567", avatar: "https://i.pravatar.cc/64?img=33", lastActive: "Vừa xong" },
  { id: 2, name: "Chủ shop", email: "owner@demo.local", password: "123456", role: "SHOP_OWNER", status: "active", phone: "090 222 3333", avatar: "https://i.pravatar.cc/64?img=12", lastActive: "Vừa xong" },
  { id: 3, name: "Nhân viên", email: "staff@demo.local", password: "123456", role: "EMPLOYEE", status: "active", phone: "090 333 4444", avatar: "https://i.pravatar.cc/64?img=11", lastActive: "Vừa xong" },
  { id: 4, name: "Người xem", email: "viewer@demo.local", password: "123456", role: "VIEWER", status: "active", phone: "090 555 6666", avatar: "https://i.pravatar.cc/64?img=5", lastActive: "Vừa xong" },
  { id: 5, name: "Nguyễn Văn An", email: "an.nguyen@handmadeshop.vn", password: "123456", role: "ADMIN", status: "active", phone: "091 111 2222", avatar: "https://i.pravatar.cc/64?img=32", lastActive: "2 phút trước" },
  { id: 6, name: "Trần Thị Bình", email: "binh.tran@handmadeshop.vn", password: "123456", role: "EMPLOYEE", status: "active", phone: "092 333 4444", avatar: "https://i.pravatar.cc/64?img=47", lastActive: "1 giờ trước" },
  { id: 7, name: "Lê Hoàng Cường", email: "cuong.le@handmadeshop.vn", password: "123456", role: "VIEWER", status: "disabled", phone: "093 555 6666", avatar: "https://i.pravatar.cc/64?img=12", lastActive: "3 ngày trước" },
  { id: 8, name: "Phạm Minh Đức", email: "duc.pham@handmadeshop.vn", password: "123456", role: "EMPLOYEE", status: "disabled", phone: "094 777 8888", avatar: "https://i.pravatar.cc/64?img=15", lastActive: "Chưa từng" },
  { id: 9, name: "Vũ Thanh Hà", email: "ha.vu@handmadeshop.vn", password: "123456", role: "VIEWER", status: "active", phone: "095 999 0000", avatar: "https://i.pravatar.cc/64?img=49", lastActive: "15 phút trước" },
];

export const INCOME_CATEGORIES = [
  { id: 1, name: "Bán hàng" },
  { id: 2, name: "Thu khác" },
];

export const EXPENSE_CATEGORIES = [
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

export const INCOMES = [
  { id: 1, incomeDate: "2026-07-12", description: "Crochet Daisy", categoryId: 1, amount: 95, currency: "USD", referenceCode: "ETS-8801", orderCode: "ETS-8801", saleRegion: "IN_EU", productQty: 2, taxPercent: 20, source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-07-12T10:00:00.000Z", updatedAt: "2026-07-12T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 2, incomeDate: "2026-07-28", description: "Móc khóa", categoryId: 1, amount: 140, currency: "USD", referenceCode: "WH-07", orderCode: "WH-07", saleRegion: "OUTSIDE_EU", productQty: 40, taxPercent: 0, source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-07-28T09:00:00.000Z", updatedAt: "2026-07-28T09:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 3, incomeDate: "2026-08-08", description: "Felt Heart", categoryId: 1, amount: 110, currency: "USD", referenceCode: "ETS-8902", orderCode: "ETS-8902", saleRegion: "OUTSIDE_EU", productQty: 3, taxPercent: 0, source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-08-08T11:20:00.000Z", updatedAt: "2026-08-08T11:20:00.000Z", deletedAt: null, deletedBy: null },
  { id: 4, incomeDate: "2026-08-22", description: "Mini tote", categoryId: 1, amount: 175, currency: "USD", referenceCode: "WEB-175", orderCode: "WEB-175", saleRegion: "IN_EU", productQty: 1, taxPercent: 20, source: "MANUAL", note: "", attachment: { name: "bill-web-175.pdf", type: "application/pdf", size: 48200 }, createdBy: 3, createdAt: "2026-08-22T14:00:00.000Z", updatedAt: "2026-08-22T14:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 5, incomeDate: "2026-09-08", description: "Hoàn phí ship", categoryId: 2, amount: 12.5, currency: "USD", referenceCode: "", orderCode: "", saleRegion: "", productQty: null, taxPercent: 0, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-08T08:30:00.000Z", updatedAt: "2026-09-08T08:30:00.000Z", deletedAt: null, deletedBy: null },
  { id: 6, incomeDate: "2026-09-10", description: "Túi xách", categoryId: 1, amount: 190, currency: "USD", referenceCode: "WEB-190", orderCode: "WEB-190", saleRegion: "OUTSIDE_EU", productQty: 1, taxPercent: 0, source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-09-10T10:00:00.000Z", updatedAt: "2026-09-10T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 7, incomeDate: "2026-09-12", description: "Móc khóa sỉ", categoryId: 1, amount: 150, currency: "USD", referenceCode: "WH-04", orderCode: "WH-04", saleRegion: "OUTSIDE_EU", productQty: 50, taxPercent: 0, source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-09-12T09:15:00.000Z", updatedAt: "2026-09-12T09:15:00.000Z", deletedAt: null, deletedBy: null },
  { id: 8, incomeDate: "2026-09-14", description: "Clay earrings", categoryId: 1, amount: 120, currency: "USD", referenceCode: "ETS-9012", orderCode: "ETS-9012", saleRegion: "IN_EU", productQty: 2, taxPercent: 20, source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-14T16:40:00.000Z", updatedAt: "2026-09-14T16:40:00.000Z", deletedAt: null, deletedBy: null },
  { id: 9, incomeDate: "2026-09-15", description: "Beaded bracelet", categoryId: 1, amount: 85, currency: "USD", referenceCode: "ETS-9011", orderCode: "ETS-9011", saleRegion: "OUTSIDE_EU", productQty: 1, taxPercent: 0, source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-15T14:02:00.000Z", updatedAt: "2026-09-15T14:02:00.000Z", deletedAt: null, deletedBy: null },
  { id: 10, incomeDate: "2026-07-20", description: "Pom-pom keychain", categoryId: 1, amount: 72, currency: "USD", referenceCode: "HC-07", orderCode: "HC-07", saleRegion: "OUTSIDE_EU", productQty: 15, taxPercent: 8, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-07-20T12:00:00.000Z", updatedAt: "2026-07-20T12:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 11, incomeDate: "2026-08-18", description: "Hoàn cọc", categoryId: 2, amount: 14, currency: "USD", referenceCode: "", orderCode: "", saleRegion: "", productQty: null, taxPercent: 0, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-08-18T09:00:00.000Z", updatedAt: "2026-08-18T09:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 12, incomeDate: "2026-09-10", description: "Sunflower bouquet", categoryId: 1, amount: 98, currency: "USD", referenceCode: "HC-09", orderCode: "HC-09", saleRegion: "OUTSIDE_EU", productQty: 20, taxPercent: 8, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-10T11:00:00.000Z", updatedAt: "2026-09-10T11:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 13, incomeDate: "2026-09-13", description: "Lily Flower", categoryId: 1, amount: 22.1, currency: "USD", referenceCode: "4154185113", orderCode: "4154185113", saleRegion: "IN_EU", productQty: 5, unitPrice: 5.49, itemTotal: 27.45, discountAmount: 12.35, discountCode: "AGSALE43", subtotal: 15.1, shippingAmount: 7, taxAmount: 0, taxPercent: 0, source: "MANUAL", note: "Pink × 3 · White × 2 @ 5,49 US$\nShip: Meline Bormann, Ahornallee 12, 22848 Norderstedt, Germany\nTxn: 5190857082, 5190857080", attachment: null, createdBy: 2, createdAt: "2026-09-13T10:00:00.000Z", updatedAt: "2026-09-13T10:00:00.000Z", deletedAt: null, deletedBy: null },
];

export const EXPENSES = [
  { id: 1, expenseDate: "2026-07-05", description: "Mua len thô (T7)", categoryId: 1, amount: 90, currency: "USD", recipient: "Yarn Shop", originScope: "INTERNATIONAL", taxPercent: 0, amountAfterTax: 90, source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-07-05T10:00:00.000Z", updatedAt: "2026-07-05T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 2, expenseDate: "2026-07-18", description: "Quảng cáo Meta ads (T7)", categoryId: 4, amount: 80, currency: "USD", recipient: "Meta", originScope: "INTERNATIONAL", taxPercent: 0, amountAfterTax: 80, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-07-18T13:00:00.000Z", updatedAt: "2026-07-18T13:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 3, expenseDate: "2026-08-04", description: "Hộp giấy carton (T8)", categoryId: 2, amount: 40, currency: "USD", recipient: "Xưởng bao bì", originScope: "DOMESTIC", taxPercent: 10, amountAfterTax: 44, source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-08-04T09:30:00.000Z", updatedAt: "2026-08-04T09:30:00.000Z", deletedAt: null, deletedBy: null },
  { id: 4, expenseDate: "2026-08-19", description: "Phí vận chuyển quốc tế (T8)", categoryId: 3, amount: 98, currency: "USD", recipient: "DHL", originScope: "INTERNATIONAL", taxPercent: 0, amountAfterTax: 98, source: "EXCEL_IMPORT", note: "", attachment: { name: "dhl-aug.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 22100 }, createdBy: 2, createdAt: "2026-08-19T15:00:00.000Z", updatedAt: "2026-08-19T15:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 5, expenseDate: "2026-09-08", description: "Quảng cáo Meta ads", categoryId: 4, amount: 120, currency: "USD", recipient: "Meta", originScope: "INTERNATIONAL", taxPercent: 0, amountAfterTax: 120, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-08T10:00:00.000Z", updatedAt: "2026-09-08T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 6, expenseDate: "2026-09-10", description: "Phí dịch vụ Etsy tháng 8", categoryId: 5, amount: 78.5, currency: "USD", recipient: "Etsy", originScope: "INTERNATIONAL", taxPercent: 0, amountAfterTax: 78.5, source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-10T16:02:00.000Z", updatedAt: "2026-09-10T16:02:00.000Z", deletedAt: null, deletedBy: null },
  { id: 7, expenseDate: "2026-09-12", description: "Phí vận chuyển quốc tế", categoryId: 3, amount: 115, currency: "USD", recipient: "DHL", originScope: "INTERNATIONAL", taxPercent: 0, amountAfterTax: 115, source: "EXCEL_IMPORT", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-12T11:00:00.000Z", updatedAt: "2026-09-12T11:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 8, expenseDate: "2026-09-14", description: "Hộp giấy carton", categoryId: 2, amount: 45, currency: "USD", recipient: "Xưởng bao bì", originScope: "DOMESTIC", taxPercent: 10, amountAfterTax: 49.5, source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-09-14T08:40:00.000Z", updatedAt: "2026-09-14T08:40:00.000Z", deletedAt: null, deletedBy: null },
  { id: 9, expenseDate: "2026-09-15", description: "Mua 20 cuộn len thô", categoryId: 1, amount: 180, currency: "USD", recipient: "Yarn Shop", originScope: "INTERNATIONAL", taxPercent: 0, amountAfterTax: 180, source: "MANUAL", note: "", attachment: null, createdBy: 3, createdAt: "2026-09-15T13:40:00.000Z", updatedAt: "2026-09-15T13:40:00.000Z", deletedAt: null, deletedBy: null },
  { id: 10, expenseDate: "2026-07-22", description: "Thuê gian hàng (T7)", categoryId: 8, amount: 14, currency: "USD", recipient: "BTC hội chợ", originScope: "DOMESTIC", taxPercent: 10, amountAfterTax: 15.4, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-07-22T09:00:00.000Z", updatedAt: "2026-07-22T09:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 11, expenseDate: "2026-08-12", description: "Điện / nước / Internet (T8)", categoryId: 7, amount: 11, currency: "USD", recipient: "Nhà mạng", originScope: "DOMESTIC", taxPercent: 10, amountAfterTax: 12.1, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-08-12T10:00:00.000Z", updatedAt: "2026-08-12T10:00:00.000Z", deletedAt: null, deletedBy: null },
  { id: 12, expenseDate: "2026-09-10", description: "Thuê gian hàng hội chợ", categoryId: 8, amount: 16, currency: "USD", recipient: "BTC hội chợ", originScope: "DOMESTIC", taxPercent: 10, amountAfterTax: 17.6, source: "MANUAL", note: "", attachment: null, createdBy: 2, createdAt: "2026-09-10T12:00:00.000Z", updatedAt: "2026-09-10T12:00:00.000Z", deletedAt: null, deletedBy: null },
];

(function seedListDemo() {
  const products = [
    "Macrame rainbow", "Pipe cleaner rose", "Resin keychain", "Knitted coaster",
    "Embroidery hoop", "Linen scrunchie", "Wooden brooch", "Cat plush pin",
    "Star hair clip", "Lavender sachet", "Mini wreath", "Cloud night light",
    "Tulip bouquet", "Owl plush", "Heart pouch", "Bee magnet",
    "Cactus decor", "Moon hanging", "Pearl necklace", "Daisy clip",
    "Bunny plush", "Leaf bookmark", "Tea cozy", "Felt mushroom",
    "Crochet bee", "Shell earrings", "Tiny cactus"
  ];
  products.forEach((name, i) => {
    const month = ["07", "08", "09"][i % 3];
    const day = String((i % 27) + 1).padStart(2, "0");
    const qty = 1 + (i % 4);
    const unit = Math.round((5.5 + (i % 6) * 1.25) * 100) / 100;
    const item = Math.round(unit * qty * 100) / 100;
    const disc = i % 4 === 0 ? Math.round(item * 0.12 * 100) / 100 : 0;
    const ship = i % 3 === 0 ? 7 : i % 3 === 1 ? 4.5 : 0;
    const tax = i % 5 === 0 ? Math.round((item - disc) * 0.19 * 100) / 100 : 0;
    const amount = Math.round((item - disc + ship + tax) * 100) / 100;
    const iso = `2026-${month}-${day}`;
    const code = `ETS-${9100 + i}`;
    INCOMES.push({
      id: 14 + i,
      incomeDate: iso,
      description: name,
      categoryId: 1,
      amount,
      currency: "USD",
      referenceCode: code,
      orderCode: code,
      saleRegion: i % 2 === 0 ? "IN_EU" : "OUTSIDE_EU",
      productQty: qty,
      unitPrice: unit,
      itemTotal: item,
      discountAmount: disc,
      discountCode: disc ? "AGSALE43" : "",
      subtotal: Math.round((item - disc) * 100) / 100,
      shippingAmount: ship,
      taxAmount: tax,
      taxPercent: tax ? 19 : 0,
      source: i % 3 === 0 ? "EXCEL_IMPORT" : "MANUAL",
      note: "",
      attachment: null,
      createdBy: i % 2 === 0 ? 2 : 3,
      createdAt: `${iso}T11:00:00.000Z`,
      updatedAt: `${iso}T11:00:00.000Z`,
      deletedAt: null,
      deletedBy: null,
    });
  });
  const extraExp = [
    ["Keo hot glue", 1, "Craft Store", "DOMESTIC", 10],
    ["Tem dán kraft", 2, "Xưởng bao bì", "DOMESTIC", 10],
    ["In card cảm ơn", 2, "Print shop", "DOMESTIC", 8],
    ["Phí PayPal", 5, "PayPal", "INTERNATIONAL", 0],
    ["Len cotton", 1, "Yarn Shop", "INTERNATIONAL", 0],
    ["Kim móc", 9, "Yarn Shop", "INTERNATIONAL", 0],
    ["Túi organza", 2, "PackMart", "DOMESTIC", 10],
    ["Ads Google", 4, "Google", "INTERNATIONAL", 0],
    ["Phí domain", 5, "Namecheap", "INTERNATIONAL", 0],
    ["Băng keo", 2, "Văn phòng phẩm", "DOMESTIC", 10],
    ["Ship nội địa", 3, "GHN", "DOMESTIC", 8],
    ["Thuê studio chụp", 8, "Studio Mini", "DOMESTIC", 10],
    ["Mực in", 9, "Print shop", "DOMESTIC", 10],
    ["Box nến", 2, "Xưởng bao bì", "DOMESTIC", 10],
    ["Phí Etsy ads", 4, "Etsy", "INTERNATIONAL", 0],
    ["Cước điện thoại", 7, "Nhà mạng", "DOMESTIC", 10],
    ["Kéo cắt chỉ", 9, "Craft Store", "DOMESTIC", 10],
    ["Ribbon lụa", 2, "PackMart", "DOMESTIC", 10],
    ["Phí chuyển khoản", 5, "Ngân hàng", "DOMESTIC", 0],
    ["Bóng đèn chụp", 9, "Điện máy", "DOMESTIC", 10],
  ];
  extraExp.forEach((row, i) => {
    const [description, categoryId, recipient, originScope, taxPercent] = row;
    const month = ["07", "08", "09"][i % 3];
    const day = String((i % 26) + 2).padStart(2, "0");
    const amount = 8 + (i % 9) * 6;
    const amountAfterTax = Math.round(amount * (1 + taxPercent / 100) * 100) / 100;
    const iso = `2026-${month}-${day}`;
    EXPENSES.push({
      id: 13 + i,
      expenseDate: iso,
      description,
      categoryId,
      amount,
      currency: "USD",
      recipient,
      originScope,
      taxPercent,
      amountAfterTax,
      source: i % 4 === 0 ? "EXCEL_IMPORT" : "MANUAL",
      note: "",
      attachment: null,
      createdBy: i % 2 === 0 ? 2 : 3,
      createdAt: `${iso}T09:30:00.000Z`,
      updatedAt: `${iso}T09:30:00.000Z`,
      deletedAt: null,
      deletedBy: null,
    });
  });
})();

export const SALES_CHANNELS = ["ETSY_STORE", "WEBSITE_DIRECT", "INSTAGRAM_SHOP", "LOCAL_MARKET", "B2B_WHOLESALE"];
export const PAYMENT_METHODS = ["CREDIT_CARD", "BANK_TRANSFER", "CASH", "PAYPAL"];

INCOMES.forEach((r) => {
  if (r.amountAfterTax == null) {
    r.amountAfterTax = Math.round((Number(r.amount) || 0) * (1 + (Number(r.taxPercent) || 0) / 100) * 100) / 100;
  }
  if (!r.salesChannel) r.salesChannel = SALES_CHANNELS[r.id % SALES_CHANNELS.length];
  if (!r.recordStatus) {
    const n = r.id % 7;
    r.recordStatus = n === 5 ? "DRAFT" : n === 2 ? "PENDING" : "COMPLETED";
  }
});
EXPENSES.forEach((r) => {
  if (!r.paymentMethod) r.paymentMethod = PAYMENT_METHODS[r.id % PAYMENT_METHODS.length];
  if (!r.recordStatus) r.recordStatus = r.id % 7 === 3 ? "PENDING" : "COMPLETED";
});


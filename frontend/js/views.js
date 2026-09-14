let importTab = "flow";
let profileTab = "account";
let userFilterTab = "all";
let userQuery = "";
let reportFilterOpen = false;
let formModalKind = null;
let formModalEditId = null;

const CRUMB = {
  dashboard: ["Dashboard", "Tổng quan tài chính"],
  incomes: ["Dashboard", "Quản lý khoản thu"],
  "income-form": ["Dashboard", "Thêm khoản thu"],
  "income-edit": ["Dashboard", "Sửa khoản thu"],
  expenses: ["Dashboard", "Quản lý khoản chi"],
  "expense-form": ["Dashboard", "Thêm khoản chi"],
  "expense-edit": ["Dashboard", "Sửa khoản chi"],
  reports: ["Dashboard", "Báo cáo & Phân tích"],
  import: ["Dashboard", "Import dữ liệu Excel"],
  audit: ["Dashboard", "Nhật ký hoạt động"],
  users: ["Dashboard", "Quản lý người dùng"],
  profile: ["Dashboard", "Hồ sơ cá nhân"],
  forbidden: ["Dashboard", "Không có quyền"],
};

NAV.length = 0;
NAV.push(
  { page: "dashboard", label: "Dashboard", perm: "dashboard", icon: "layout-dashboard" },
  { page: "incomes", label: "Quản lý khoản thu", perm: "incomeRead", icon: "trending-up" },
  { page: "expenses", label: "Quản lý khoản chi", perm: "expenseRead", icon: "trending-down" },
  { page: "reports", label: "Báo cáo", perm: "reportRead", icon: "pie-chart" },
  { page: "import", label: "Import dữ liệu Excel", perm: "importData", icon: "file-spreadsheet" },
  { page: "audit", label: "Nhật ký hoạt động", perm: "auditRead", icon: "scroll-text" }
);

Object.assign(TITLES, {
  incomes: "Quản lý khoản thu",
  expenses: "Quản lý khoản chi",
  reports: "Báo cáo & Phân tích",
  import: "Import Dữ liệu Excel",
  users: "Quản lý người dùng",
});

function lucideI(name, size) {
  return `<i data-lucide="${name}"${size ? ` width="${size}" height="${size}"` : ""}></i>`;
}
function roleUi(role) {
  if (role === "ADMIN") return "Quản trị viên";
  if (role === "SHOP_OWNER") return "Chủ shop";
  if (role === "EMPLOYEE") return "Nhân viên";
  return "Người xem";
}
function rolePill(role) {
  const map = {
    ADMIN: { cls: "admin", icon: "shield" },
    SHOP_OWNER: { cls: "owner", icon: "store" },
    EMPLOYEE: { cls: "staff", icon: "pencil" },
    VIEWER: { cls: "viewer", icon: "eye" },
  };
  const m = map[role] || map.VIEWER;
  return `<span class="role-pill ${m.cls}">${lucideI(m.icon, 14)} ${roleUi(role)}</span>`;
}
function vndAbs(n) {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(Number(n) || 0)) + " đ";
}
function recStatus(id, kind, rec) {
  const code = rec?.recordStatus;
  if (code === "PENDING") return { k: "pending", t: "Chờ xử lý" };
  if (code === "DRAFT") return { k: "draft", t: "Bản nháp" };
  if (code === "COMPLETED") return { k: "done", t: kind === "expense" ? "Hoàn tất" : "Hoàn thành" };
  const n = Number(id) % 7;
  if (kind === "expense") {
    if (n === 3) return { k: "pending", t: "Chờ xử lý" };
    return { k: "done", t: "Hoàn tất" };
  }
  if (n === 2) return { k: "pending", t: "Chờ xử lý" };
  if (n === 5) return { k: "draft", t: "Bản nháp" };
  return { k: "done", t: "Hoàn thành" };
}
function salesChannelLabel(v) {
  const map = {
    ETSY_STORE: "Etsy Store",
    WEBSITE_DIRECT: "Website Direct",
    INSTAGRAM_SHOP: "Instagram Shop",
    LOCAL_MARKET: "Local Market",
    B2B_WHOLESALE: "B2B Wholesale",
  };
  return map[v] || "—";
}
function paymentMethodLabel(v) {
  const map = {
    CREDIT_CARD: "Thẻ tín dụng",
    BANK_TRANSFER: "Chuyển khoản",
    CASH: "Tiền mặt",
    PAYPAL: "PayPal",
  };
  return map[v] || "—";
}
function statusHtml(st) {
  const cls = st.k === "done" ? "ok" : st.k === "pending" ? "warn" : "neutral";
  const ico = st.k === "done" ? "check-circle" : st.k === "pending" ? "clock" : "file";
  return `<span class="badge ${cls}">${lucideI(ico, 12)} ${st.t}</span>`;
}
function usd(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);
}
function pageHead(title, sub, actions) {
  return `<div class="page-head"><div><h1 class="page-title">${title}</h1><p class="page-sub">${sub}</p></div><div class="head-actions">${actions || ""}</div></div>`;
}
function kpiCard(k) {
  const deltaCls = String(k.delta || "").startsWith("-") || k.up === false ? "down" : "up";
  return `<article class="card kpi">
    <div class="label">${k.label}</div>
    ${k.icon ? `<span class="kpi-ico ${k.tone || "blue"}">${lucideI(k.icon)}</span>` : ""}
    <div class="value num">${k.value}</div>
    ${k.delta ? `<div class="chg ${deltaCls}">${k.delta}</div>` : ""}
  </article>`;
}
function refreshIcons() {
  if (window.lucide) lucide.createIcons({ attrs: { width: 16, height: 16, "stroke-width": 1.75 } });
}

buildNav = function () {
  const items = NAV.filter((n) => can(n.perm))
    .map(
      (n) =>
        `<button class="nav-btn ${navKey(page) === n.page ? "active" : ""}" data-go="${n.page}">${lucideI(n.icon)} ${n.label}</button>`
    )
    .join("");
  document.getElementById("main-nav").innerHTML = items;
  const u = currentUser();
  const av = u.avatar ? `<img alt="" src="${u.avatar}" />` : `<img alt="" src="${AVATAR_ADMIN}" />`;
  let foot = "";
  if (can("userManagement")) {
    foot += `<button class="nav-btn ${page === "users" ? "active" : ""}" data-go="users">${lucideI("users")} Quản lý người dùng</button>`;
  }
  foot += `<button class="nav-btn ${page === "profile" ? "active" : ""}" data-go="profile">${lucideI("user-cog")} Hồ sơ cá nhân</button>`;
  foot += `<div class="user-chip"><span class="avatar">${av}</span><div><strong class="chip-role">Quản trị viên</strong></div></div>`;
  document.getElementById("side-foot").innerHTML = foot;
};

fillTopbar = function () {
  const u = currentUser();
  const c = CRUMB[page] || ["Dashboard", TITLES[page] || ""];
  document.getElementById("topbar-title").innerHTML = `${c[0]} <span class="crumb-sep">›</span> <b>${c[1]}</b>`;
  document.getElementById("top-name").textContent = u.role === "ADMIN" ? UI_MOCK.displayName : u.name;
  document.getElementById("top-role").textContent = roleUi(u.role);
  const av = document.getElementById("top-avatar");
  av.innerHTML = `<img alt="" src="${u.avatar || AVATAR_ADMIN}" />`;
};

pagerBar = function (_kind, p, pages, total) {
  if (!total) return "";
  const from = (p - 1) * PAGE_SIZE + 1;
  const to = Math.min(p * PAGE_SIZE, total);
  const btns = [];
  btns.push(`<button type="button" class="btn ghost pager-btn" data-list-page="${p - 1}" ${p <= 1 ? "disabled" : ""}>Trước</button>`);
  const windowStart = Math.max(1, p - 2);
  const windowEnd = Math.min(pages, windowStart + 4);
  for (let i = windowStart; i <= windowEnd; i++) {
    btns.push(`<button type="button" class="btn ${i === p ? "primary" : "ghost"} pager-btn" data-list-page="${i}">${i}</button>`);
  }
  if (pages > windowEnd) {
    btns.push(`<span class="muted">...</span>`);
    btns.push(`<button type="button" class="btn ghost pager-btn" data-list-page="${pages}">${pages}</button>`);
  }
  btns.push(`<button type="button" class="btn ghost pager-btn" data-list-page="${p + 1}" ${p >= pages ? "disabled" : ""}>Sau</button>`);
  return `<div class="pager"><span class="muted">Hiển thị ${from} – ${to} trên tổng số ${total} bản ghi</span><div class="pager-pages">${btns.join("")}</div></div>`;
};

listFilters = function (kind) {
  const cats = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const catLabel = kind === "income" ? "Loại thu" : "Loại chi";
  const ph =
    kind === "income"
      ? "Tìm tên sản phẩm, mã đơn, người tạo..."
      : "Tìm nội dung, người nhận...";
  const extra =
    kind === "income"
      ? `<select id="fRegion" class="toolbar-ctrl"><option value="">Khu vực: Tất cả</option><option value="IN_EU" ${listFilter.region === "IN_EU" ? "selected" : ""}>Trong EU</option><option value="OUTSIDE_EU" ${listFilter.region === "OUTSIDE_EU" ? "selected" : ""}>Ngoài EU</option></select>`
      : `<select id="fOrigin" class="toolbar-ctrl"><option value="">Phạm vi: Tất cả</option><option value="DOMESTIC" ${listFilter.origin === "DOMESTIC" ? "selected" : ""}>Nội địa</option><option value="INTERNATIONAL" ${listFilter.origin === "INTERNATIONAL" ? "selected" : ""}>Quốc tế</option></select>`;
  return `
    <div class="toolbar">
      <label class="search-box toolbar-search">
        ${lucideI("search")}
        <input id="q" type="search" placeholder="${ph}" value="${escAttr(listFilter.q)}" />
      </label>
      <select id="fCat" class="toolbar-ctrl"><option value="">${catLabel}: Tất cả</option>${cats.map((c) => `<option value="${c.id}" ${listFilter.cat === String(c.id) ? "selected" : ""}>${c.name}</option>`).join("")}</select>
      <select id="fSrc" class="toolbar-ctrl"><option value="">Nguồn: Tất cả</option><option value="MANUAL" ${listFilter.src === "MANUAL" ? "selected" : ""}>Nhập tay</option><option value="EXCEL_IMPORT" ${listFilter.src === "EXCEL_IMPORT" ? "selected" : ""}>Excel</option></select>
      ${extra}
      <select id="fCcy" class="toolbar-ctrl" title="Đổi tiền">${ccyOptions()}</select>
      <input id="fFrom" class="toolbar-ctrl" type="date" title="Từ ngày" value="${listFilter.from}" />
      <input id="fTo" class="toolbar-ctrl" type="date" title="Đến ngày" value="${listFilter.to}" />
    </div>`;
};

dashboard = function () {
  const inc = filteredIncomes().filter((x) => inRange(x.incomeDate, dashFrom, dashTo));
  const exp = filteredExpenses().filter((x) => inRange(x.expenseDate, dashFrom, dashTo));
  const tin = sum(inc);
  const tex = sum(exp);
  const cats = incomeByCat(inc);
  const maxG = Math.max(1, ...cats.map((g) => g.amount));
  const colors = ["#3B82F6", "#22C55E", "#F59E0B", "#A3E635", "#06B6D4"];
  const recent = [
    ...inc.map((r) => ({ ...r, kind: "in", date: r.incomeDate })),
    ...exp.map((r) => ({ ...r, kind: "out", date: r.expenseDate })),
  ]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);
  return `
    <div class="hero card" style="--hero-img:url('${IMG_HERO}')">
      <span class="hero-badge">Chào mừng trở lại, Admin</span>
      <h2>Quản trị tài chính Cửa hàng<br/>Handmade</h2>
      <p>Theo dõi doanh thu, chi phí và lợi nhuận. Số liệu hiển thị ${ccy} (đổi tiền xem, dữ liệu gốc USD).</p>
      <div class="hero-actions">
        ${can("reportRead") ? `<button class="btn primary" data-go="reports">${lucideI("bar-chart-3")} Báo cáo chi tiết</button>` : ""}
        ${can("incomeCreate") ? `<button class="btn secondary" data-go="income-form">${lucideI("plus")} Thêm giao dịch mới</button>` : ""}
      </div>
    </div>
    <div class="kpis">
      ${kpiCard({ label: `Tổng doanh thu (${ccy})`, value: money(tin), icon: "trending-up", tone: "green" })}
      ${kpiCard({ label: `Tổng chi phí (${ccy})`, value: money(tex), icon: "trending-down", tone: "orange" })}
      ${kpiCard({ label: `Lợi nhuận ròng (${ccy})`, value: money(tin - tex), icon: "wallet", tone: "blue" })}
      ${kpiCard({ label: "Số giao dịch", value: String(inc.length + exp.length), icon: "circle-dollar-sign", tone: "purple" })}
    </div>
    <div class="grid-70-30">
      <article class="card">
        <div class="card-head">
          <div><h3 class="section-title">Biểu đồ Thu chi</h3><p class="muted">Chọn khoảng ngày và loại tiền để xem sơ đồ</p></div>
          <div class="head-actions dash-chart-tools">
            <input id="dashFrom" class="toolbar-ctrl" type="date" value="${dashFrom}" title="Từ ngày" />
            <input id="dashTo" class="toolbar-ctrl" type="date" value="${dashTo}" title="Đến ngày" />
            <select id="ccySel" class="toolbar-ctrl" title="Đổi tiền">${ccyOptions()}</select>
          </div>
        </div>
        <div class="chart-wrap"><canvas id="barChart"></canvas></div>
      </article>
      <article class="card">
        <h3 class="section-title">Doanh thu theo Nhóm</h3>
        <p class="muted" style="margin-bottom:12px">Tỉ lệ theo loại thu · ${ccy}</p>
        <div class="hbar">
          ${
            cats.length
              ? cats
                  .map(
                    (g, i) =>
                      `<div class="hbar-row"><span>${g.name}</span><div class="hbar-track"><div class="hbar-fill" style="width:${Math.round((g.amount / maxG) * 100)}%;background:${colors[i % colors.length]}"></div></div></div>`
                  )
                  .join("")
              : `<div class="empty">Chưa có khoản thu trong kỳ.</div>`
          }
        </div>
        <div class="group-legend">
          ${cats.map((g, i) => `<div><span><i class="swatch" style="background:${colors[i % colors.length]}"></i>${g.name}</span><b class="num">${money(g.amount)}</b></div>`).join("")}
        </div>
      </article>
    </div>
    <article class="card" style="padding:0">
      <div class="card-head" style="padding:14px 16px 0">
        <div><h3 class="section-title">Giao dịch gần đây</h3><p class="muted">Trong kỳ đã chọn · ${ccy}</p></div>
        <button class="link" data-go="incomes">Xem tất cả</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Ngày</th><th>Nội dung</th><th>Loại</th><th class="amount">Số tiền</th></tr></thead>
          <tbody>
            ${
              recent.length
                ? recent
                    .map(
                      (t) => `<tr>
                  <td class="muted">${dmy(t.date)}</td>
                  <td>${t.description}</td>
                  <td>${t.kind === "in" ? "Thu" : "Chi"}</td>
                  <td class="amount ${t.kind === "in" ? "plus" : "minus"}">${t.kind === "in" ? "+" : "−"} ${money(t.amount)}</td>
                </tr>`
                    )
                    .join("")
                : `<tr><td colspan="4"><div class="empty">Không có giao dịch trong khoảng ngày.</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </article>
    <p class="page-foot">© 2024 HandmadeFinance. Hệ thống quản trị nội bộ.</p>`;
};

incomeList = function () {
  const all = listedIncomes();
  const { rows, p, pages, total } = pageSlice(all, incomePage);
  incomePage = p;
  const showAct = can("incomeUpdate") || can("incomeDelete");
  return `
    ${pageHead(
      "Quản lý khoản thu",
      "Theo dõi và quản lý chi tiết các nguồn doanh thu từ đơn hàng của bạn.",
      `${can("reportRead") ? `<button class="btn ghost" id="export-report">${lucideI("download")} Xuất báo cáo</button>` : ""}
       ${can("incomeCreate") ? `<button class="btn primary" data-go="income-form">${lucideI("plus")} Thêm khoản thu</button>` : ""}`
    )}
    <div class="kpis">${UI_MOCK.incomeKpis.map(kpiCard).join("")}</div>
    ${listFilters("income")}
    <article class="card" style="padding:0">
      <div class="card-head list-card-head">
        <div><h3 class="section-title">Danh sách khoản thu</h3><p class="muted">Bảng đủ trường thu. Bấm tên sản phẩm hoặc nút mắt để xem chi tiết</p></div>
        <div class="list-card-actions">
          <button class="btn ghost sm" type="button" id="open-cols-modal">${lucideI("columns-3")} Cột hiển thị</button>
          <button class="btn ghost sm" type="button" id="clearF">${lucideI("rotate-ccw")} Xóa bộ lọc</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${thCol("income", "date", "Ngày")}
            ${thCol("income", "product", "Sản phẩm")}
            ${thCol("income", "category", "Loại thu")}
            ${thCol("income", "order", "Mã đơn")}
            ${thCol("income", "region", "Khu vực")}
            ${thCol("income", "qty", "SL", "amount")}
            ${thCol("income", "item", "Item", "amount")}
            ${thCol("income", "discount", "Giảm giá", "amount")}
            ${thCol("income", "ship", "Ship", "amount")}
            ${thCol("income", "tax", "Thuế", "amount")}
            ${thCol("income", "amount", "Trước thuế", "amount")}
            ${thCol("income", "taxPercent", "% thuế", "amount")}
            ${thCol("income", "afterTax", "Sau thuế", "amount")}
            ${thCol("income", "source", "Nguồn")}
            ${thCol("income", "creator", "Người tạo")}
            <th>Thao tác</th>
          </tr></thead>
          <tbody id="rows">${incomeRowsUi(rows, showAct)}</tbody>
        </table>
      </div>
      ${total ? pagerBar("income", p, pages, total) : `<div class="empty"><strong>Chưa có khoản thu nào.</strong></div>`}
    </article>
    <div class="grid-2">
      <article class="card">
        <h3 class="section-title">Ghi chú vận hành</h3>
        <p class="muted" style="margin-bottom:10px">Thông tin bổ sung cần lưu ý cho các khoản thu định kỳ</p>
        <div class="note-stack">
          <div class="alert-box info">${lucideI("info")}<div><b>Chính sách Thuế EU (VAT)</b>Loại bỏ đăng ký thuế VAT 19% cho đơn hàng tại Đức và 20% cho đơn hàng tại Pháp đối với mặt hàng handmade dưới 150€ từ 01/06/2024.</div></div>
          <div class="alert-box warn">${lucideI("triangle-alert")}<div><b>Đối soát cuối tháng</b>Lưu ý đối soát với đối tác cổng thanh toán Stripe và PayPal vào ngày 28 hàng tháng. Vui lòng không chỉnh sửa các khoản thu đã khóa sổ.</div></div>
        </div>
      </article>
      <article class="card">
        <h3 class="section-title">Phân bổ ngoại tệ</h3>
        <p class="muted">Tỷ trọng doanh thu theo loại tiền</p>
        <div class="fx-row" style="margin-top:16px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>$ USD (Đô la Mỹ)</span><b>68%</b></div>
          <div class="fx-bar"><div class="fx-usd"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin:12px 0 6px"><span>€ EUR (Euro)</span><b>32%</b></div>
          <div class="fx-bar"><div class="fx-eur" style="width:32%;margin-left:auto"></div></div>
        </div>
        <div class="muted" style="margin-top:14px;font-size:12px">Tỷ giá tham chiếu<br/>1 EUR = 1.08352 USD<br/>1 USD = 25,450 VND</div>
        <button class="link" type="button" style="margin-top:10px">Cập nhật tỷ giá</button>
      </article>
    </div>`;
};

function incomeRowsUi(rows, showAct) {
  if (!rows.length) return "";
  return rows
    .map((r) => {
      const edit = canEditOwn(r, "incomeUpdate");
      const del = canDeleteOwn(r, "incomeDelete");
      const acts = `<td><div class="row-actions">
        <button type="button" class="icon-btn" data-view-in="${r.id}" title="Xem chi tiết">${lucideI("eye")}</button>
        ${showAct && edit ? `<button class="icon-btn" data-edit-in="${r.id}" title="Sửa">${lucideI("pencil")}</button>` : ""}
        ${showAct && del ? `<button class="icon-btn danger" data-del-in="${r.id}" title="Xóa">${lucideI("trash-2")}</button>` : ""}
      </div></td>`;
      return `<tr class="clickable" data-view-in="${r.id}" data-cat="${r.categoryId}" data-src="${r.source}" data-region="${r.saleRegion || ""}" data-date="${r.incomeDate}" data-text="${(r.description + (r.referenceCode || "") + (r.orderCode || "")).toLowerCase()}">
        ${tdCol("income", "date", dmy(r.incomeDate))}
        ${tdCol("income", "product", `<button type="button" class="link" data-view-in="${r.id}">${r.description}</button>`, "cell-product")}
        ${tdCol("income", "category", `<span class="badge mint">${catName(INCOME_CATEGORIES, r.categoryId)}</span>`)}
        ${tdCol("income", "order", r.orderCode || "—")}
        ${tdCol("income", "region", saleRegionBadge(r.saleRegion))}
        ${tdCol("income", "qty", r.productQty || "—", "amount")}
        ${tdCol("income", "item", r.itemTotal ? money(r.itemTotal) : "—", "amount")}
        ${tdCol("income", "discount", Number(r.discountAmount) ? "−" + money(r.discountAmount) : "—", "amount")}
        ${tdCol("income", "ship", Number(r.shippingAmount) ? money(r.shippingAmount) : "—", "amount")}
        ${tdCol("income", "tax", money(Number(r.taxAmount) || 0), "amount")}
        ${tdCol("income", "amount", money(r.amount), "amount plus")}
        ${tdCol("income", "taxPercent", pctLabel(r.taxPercent), "amount")}
        ${tdCol("income", "afterTax", money(afterTaxOf(r)), "amount plus")}
        ${tdCol("income", "source", srcBadge(r.source))}
        ${tdCol("income", "creator", userName(r.createdBy))}
        ${acts}</tr>`;
    })
    .join("");
}

expenseList = function () {
  const all = listedExpenses();
  const { rows, p, pages, total } = pageSlice(all, expensePage);
  expensePage = p;
  const showAct = can("expenseUpdate") || can("expenseDelete");
  return `
    ${pageHead(
      "Quản lý khoản chi",
      "Theo dõi, phân loại thuế và đối soát chứng từ các khoản chi của cửa hàng.",
      `${can("reportRead") ? `<button class="btn ghost">${lucideI("download")} Xuất báo cáo</button>` : ""}
       ${can("expenseCreate") ? `<button class="btn primary" data-go="expense-form">${lucideI("plus")} Thêm khoản chi</button>` : ""}`
    )}
    <div class="kpis">${UI_MOCK.expenseKpis.map(kpiCard).join("")}</div>
    ${listFilters("expense")}
    <article class="card" style="padding:0">
      <div class="card-head list-card-head">
        <div><h3 class="section-title">Danh sách khoản chi</h3><p class="muted">Bảng đủ trường chi. Bấm nội dung hoặc nút mắt để xem chi tiết</p></div>
        <div class="list-card-actions">
          <button class="btn ghost sm" type="button" id="open-cols-modal">${lucideI("columns-3")} Cột hiển thị</button>
          <button class="btn ghost sm" type="button" id="clearF">${lucideI("rotate-ccw")} Xóa bộ lọc</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            ${thCol("expense", "date", "Ngày")}
            ${thCol("expense", "product", "Nội dung")}
            ${thCol("expense", "category", "Loại chi")}
            ${thCol("expense", "payee", "Người nhận")}
            ${thCol("expense", "origin", "Phạm vi")}
            ${thCol("expense", "amount", "Trước thuế", "amount")}
            ${thCol("expense", "taxPercent", "% thuế", "amount")}
            ${thCol("expense", "afterTax", "Sau thuế", "amount")}
            ${thCol("expense", "source", "Nguồn")}
            ${thCol("expense", "creator", "Người tạo")}
            <th>Thao tác</th>
          </tr></thead>
          <tbody id="rows">${expenseRowsUi(rows, showAct)}</tbody>
        </table>
      </div>
      ${total ? pagerBar("expense", p, pages, total) : `<div class="empty"><strong>Chưa có khoản chi nào.</strong></div>`}
    </article>`;
};

function expenseRowsUi(rows, showAct) {
  if (!rows.length) return "";
  return rows
    .map((r) => {
      const edit = canEditOwn(r, "expenseUpdate");
      const del = canDeleteOwn(r, "expenseDelete");
      const acts = `<td><div class="row-actions">
        <button type="button" class="icon-btn" data-view-ex="${r.id}" title="Xem chi tiết">${lucideI("eye")}</button>
        ${showAct && edit ? `<button type="button" class="icon-btn" data-edit-ex="${r.id}" title="Sửa">${lucideI("pencil")}</button>` : ""}
        ${showAct && del ? `<button type="button" class="icon-btn danger" data-del-ex="${r.id}" title="Xóa">${lucideI("trash-2")}</button>` : ""}
      </div></td>`;
      return `<tr class="clickable" data-view-ex="${r.id}" data-cat="${r.categoryId}" data-src="${r.source}" data-origin="${r.originScope || ""}" data-date="${r.expenseDate}" data-text="${(r.description + (r.recipient || "")).toLowerCase()}">
        ${tdCol("expense", "date", dmy(r.expenseDate))}
        ${tdCol("expense", "product", `<button type="button" class="link cell-link" data-view-ex="${r.id}">${r.description}</button>`, "cell-product")}
        ${tdCol("expense", "category", `<span class="badge info">${catName(EXPENSE_CATEGORIES, r.categoryId)}</span>`)}
        ${tdCol("expense", "payee", r.recipient || "—")}
        ${tdCol("expense", "origin", originBadge(r.originScope))}
        ${tdCol("expense", "amount", money(r.amount), "amount minus")}
        ${tdCol("expense", "taxPercent", pctLabel(r.taxPercent), "amount")}
        ${tdCol("expense", "afterTax", money(afterTaxOf(r)), "amount minus")}
        ${tdCol("expense", "source", srcBadge(r.source))}
        ${tdCol("expense", "creator", userName(r.createdBy))}
        ${acts}</tr>`;
    })
    .join("");
}

function recordDetailHtml(kind, r) {
  const isIncome = kind === "income";
  if (!r) {
    return `<div class="exp-head"><h2>Không tìm thấy bản ghi</h2><button class="icon-ghost" type="button" id="close-exp-modal" aria-label="Đóng">${lucideI("x")}</button></div>
      <p class="muted">Khoản này có thể đã bị xóa.</p>
      <div class="exp-foot"><div class="head-actions"><button class="btn secondary" type="button" id="close-exp-modal-2">Đóng</button></div></div>`;
  }
  const st = recStatus(r.id, kind, r);
  const code = isIncome
    ? r.orderCode || r.referenceCode || `ORD-${8800 + (r.id % 900)}`
    : `EXP-${String(r.id).padStart(3, "0")}`;
  const title = r.description || (isIncome ? "Khoản thu" : "Khoản chi");
  const fileName = r.attachment?.name || `Receipt_Scan_${code}.png`;
  const canChange = isIncome ? canEditOwn(r, "incomeUpdate") : canEditOwn(r, "expenseUpdate");
  const kv = isIncome
    ? `<span>Ngày thu</span><b>${r.incomeDate}</b>
       <span>Danh mục</span><b><span class="badge info">${catName(INCOME_CATEGORIES, r.categoryId)}</span></b>
       <span>Nguồn</span><b>${salesChannelLabel(r.salesChannel) !== "—" ? salesChannelLabel(r.salesChannel) : INCOME_SOURCES_UI[r.id % INCOME_SOURCES_UI.length]}</b>
       <span>Khu vực</span><b>${saleRegionLabel(r.saleRegion)}</b>
       <span>Mã đơn</span><b>${code}</b>
       <span>Số lượng</span><b>${r.productQty || "—"}</b>
       <span>Trạng thái</span><b>${st.t}</b>`
    : `<span>Ngày thực hiện</span><b>${r.expenseDate}</b>
       <span>Danh mục</span><b><span class="badge info">${catName(EXPENSE_CATEGORIES, r.categoryId)}</span></b>
       <span>Người nhận</span><b>${r.recipient || "—"}</b>
       <span>Phạm vi</span><b>${r.originScope === "INTERNATIONAL" ? "Quốc tế" : "Nội địa"}</b>
       <span>Phương thức</span><b>${paymentMethodLabel(r.paymentMethod) !== "—" ? paymentMethodLabel(r.paymentMethod) : PAY_METHODS[r.id % PAY_METHODS.length]}</b>
       <span>Trạng thái</span><b>${st.t}</b>`;
  const item = Number(r.itemTotal) || Number(r.amount) || 0;
  const disc = Number(r.discountAmount) || 0;
  const ship = Number(r.shippingAmount) || 0;
  const taxAmt = isIncome ? Number(r.taxAmount) || 0 : round2(afterTaxOf(r) - (Number(r.amount) || 0));
  const tot = isIncome ? Number(r.amount) || 0 : afterTaxOf(r);
  const lines = isIncome
    ? `<div class="line"><span>Tạm tính (Subtotal)</span><b>${usd(item)}</b></div>
       <div class="line"><span>Giảm giá (Discount)</span><b class="minus">${disc ? "− " + usd(disc) : "—"}</b></div>
       <div class="line"><span>Vận chuyển (Shipping)</span><b>${ship ? usd(ship) : "—"}</b></div>
       <div class="line"><span>Thuế (Tax/VAT)</span><b>${usd(taxAmt)}</b></div>
       <div class="total"><span>Tổng thu<br/><small style="font-weight:500;color:var(--text-secondary);font-size:11px">Tỷ giá hạch toán: 1 USD = 24.500 VND</small></span><span>${usd(tot)}</span></div>`
    : `<div class="line"><span>Số tiền</span><b>${usd(r.amount)}</b></div>
       <div class="line"><span>Thuế (${pctLabel(r.taxPercent)})</span><b>${usd(taxAmt)}</b></div>
       <div class="line"><span>Người nhận</span><b>${r.recipient || "—"}</b></div>
       <div class="total"><span>Tổng thanh toán<br/><small style="font-weight:500;color:var(--text-secondary);font-size:11px">Tỷ giá hạch toán: 1 USD = 24.500 VND</small></span><span>${usd(tot)}</span></div>`;
  const note = r.note
    ? r.note
    : isIncome
      ? `Khoản thu ${code} được ghi nhận ${r.source === "EXCEL_IMPORT" ? "từ file Excel" : "bằng nhập tay"}.`
      : `Khoản chi ${code} đã được đối soát với sao kê. Mã tham chiếu: TXN-${480000 + (r.id % 9000)}.`;
  const primaryLabel = isIncome ? "Xác nhận đối soát" : "Xác nhận thanh toán";
  return `
    <div class="exp-head">
      <div>
        <div class="exp-kicker">${lucideI("file-text")} Hồ sơ chi tiết <span class="muted">/</span> <span class="muted">${code}</span></div>
        <h2>${title}</h2>
        <p class="muted" style="margin-top:4px">${isIncome ? "Thông tin chi tiết về khoản thu, nguồn đơn hàng và chứng từ đi kèm." : "Thông tin chi tiết về khoản chi, phân loại thuế và các chứng từ đi kèm."}</p>
      </div>
      <button class="icon-ghost" type="button" id="close-exp-modal" aria-label="Đóng">${lucideI("x")}</button>
    </div>
    <div class="exp-grid">
      <div>
        <p class="muted" style="font-size:11px;font-weight:700;letter-spacing:.04em;margin-bottom:8px">${lucideI("clipboard-list")} THÔNG TIN CƠ BẢN</p>
        <div class="kv">${kv}</div>
        <p class="muted" style="font-size:11px;font-weight:700;letter-spacing:.04em;margin:16px 0 8px">${lucideI("image")} CHỨNG TỪ ĐÍNH KÈM</p>
        <div class="receipt">
          <img src="${IMG_RECEIPT}" alt="Chứng từ" />
          <div class="fn"><span>${fileName}</span><span>${lucideI("external-link")}</span></div>
        </div>
      </div>
      <div>
        <div class="fin-box">
          <p class="muted" style="font-size:11px;font-weight:700;margin-bottom:8px">CHI TIẾT TÀI CHÍNH</p>
          ${lines}
        </div>
        <div class="alert-box info" style="margin-top:10px">${lucideI("info")}<div>${note}</div></div>
      </div>
    </div>
    <div class="exp-foot">
      <button class="link" type="button" id="exp-draft">Lưu vào nháp</button>
      <div class="head-actions">
        <button class="btn secondary" type="button" id="close-exp-modal-2">Đóng</button>
        ${canChange ? `<button class="btn ghost" type="button" id="detail-edit">Sửa</button>` : ""}
        <button class="btn primary" type="button" id="exp-confirm">${primaryLabel}</button>
      </div>
    </div>`;
}

function expenseDetailHtml(r) {
  return recordDetailHtml("expense", r);
}

reports = function () {
  const { inc, exp } = reportRows();
  const tabs = [
    ["overview", "Tổng quan"],
    ["daily", "Theo ngày"],
    ["monthly", "Theo tháng"],
    ["in", "Theo loại thu"],
    ["out", "Theo loại chi"],
  ];
  const catOpts = catFilterOptions();
  const tin = sum(inc);
  const tex = sum(exp);
  const monthVal = reportFrom.slice(0, 7) === reportTo.slice(0, 7) ? reportFrom.slice(0, 7) : "all";
  const rptKpi = (k) => {
    const down = k.up === false || String(k.delta || "").startsWith("-");
    return `<article class="card rpt-kpi">
      <div class="rpt-kpi-top">
        <span class="rpt-kpi-ico">${lucideI(k.icon || "activity")}</span>
        ${k.delta ? `<span class="chg ${down ? "down" : "up"}">${k.delta}</span>` : ""}
      </div>
      <div class="rpt-kpi-label">${k.label}</div>
      <div class="rpt-kpi-value num">${k.value}</div>
    </article>`;
  };
  const filterBar = `
    <div class="toolbar">
      <input id="rFrom" class="toolbar-ctrl" type="date" value="${reportFrom}" title="Từ ngày" />
      <input id="rTo" class="toolbar-ctrl" type="date" value="${reportTo}" title="Đến ngày" />
      <select id="ccySel" class="toolbar-ctrl" title="Đổi tiền">${ccyOptions()}</select>
      ${
        reportFilterOpen
          ? `<select id="rKind" class="toolbar-ctrl">
        <option value="ALL" ${reportKind === "ALL" ? "selected" : ""}>Loại: Tất cả</option>
        <option value="INCOME" ${reportKind === "INCOME" ? "selected" : ""}>Chỉ khoản thu</option>
        <option value="EXPENSE" ${reportKind === "EXPENSE" ? "selected" : ""}>Chỉ khoản chi</option>
      </select>
      <select id="rSrc" class="toolbar-ctrl">
        <option value="">Nguồn: Tất cả</option>
        <option value="MANUAL" ${reportSrc === "MANUAL" ? "selected" : ""}>Nhập tay</option>
        <option value="EXCEL_IMPORT" ${reportSrc === "EXCEL_IMPORT" ? "selected" : ""}>Excel</option>
      </select>
      <select id="rCat" class="toolbar-ctrl">
        <option value="">Loại: Tất cả</option>
        ${catOpts.map((c) => `<option value="${c.v}" ${reportCat === c.v ? "selected" : ""}>${c.n}</option>`).join("")}
      </select>`
          : ""
      }
    </div>
    <div class="underline-tabs">${tabs.map(([k, l]) => `<button class="tab ${reportTab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>`;
  let extra = "";
  if (reportTab === "daily" || reportTab === "monthly") extra = reportsTables();
  else if (reportTab === "in") {
    const cats = incomeByCat(inc);
    extra = `<div class="grid-2"><article class="card"><h3 class="section-title">Theo loại thu</h3><div class="chart-sm"><canvas id="rIn"></canvas></div></article>
      <article class="card"><h3 class="section-title">Chi tiết</h3>${cats.map((x) => `<div class="row-item"><span>${x.name}</span><b class="num">${money(x.amount)}</b></div>`).join("") || `<div class="empty">Chưa có khoản thu.</div>`}</article></div>`;
  } else if (reportTab === "out") {
    const cats = expenseByCat(exp);
    extra = `<div class="grid-2"><article class="card"><h3 class="section-title">Theo loại chi</h3><div class="chart-sm"><canvas id="rOut"></canvas></div></article>
      <article class="card"><h3 class="section-title">Chi tiết</h3>${cats.map((x) => `<div class="row-item"><span>${x.name}</span><b class="num">${money(x.amount)}</b></div>`).join("") || `<div class="empty">Chưa có khoản chi.</div>`}</article></div>`;
  }
  return `
    <div class="page-head rpt-head">
      <div>
        <h1 class="page-title">Báo cáo &amp; Phân tích</h1>
        <p class="page-sub">Số liệu hiển thị ${ccy}. 1 USD = ${FX_USD_TO_EUR} EUR (đổi tiền xem).</p>
      </div>
      <div class="rpt-head-actions">
        <div class="rpt-head-row">
          <label class="rpt-month">${lucideI("calendar")}
            <select id="rpt-month" aria-label="Tháng">
              <option value="all" ${monthVal === "all" ? "selected" : ""}>Tất cả (T7–T9/2026)</option>
              <option value="2026-07" ${monthVal === "2026-07" ? "selected" : ""}>Tháng 7, 2026</option>
              <option value="2026-08" ${monthVal === "2026-08" ? "selected" : ""}>Tháng 8, 2026</option>
              <option value="2026-09" ${monthVal === "2026-09" ? "selected" : ""}>Tháng 9, 2026</option>
            </select>
          </label>
          <button class="btn ghost" type="button" id="toggle-report-filters">${lucideI("list-filter")} Bộ lọc</button>
        </div>
        <button class="btn primary rpt-export" type="button" id="export-report">${lucideI("download")} Xuất dữ liệu</button>
      </div>
    </div>
    ${filterBar}
    ${
      reportTab !== "overview"
        ? extra
        : `<div class="kpis rpt-kpis">${[
            { label: `Tổng doanh thu (${ccy})`, value: money(tin), icon: "bar-chart-3" },
            { label: `Lợi nhuận ròng (${ccy})`, value: money(tin - tex), icon: "trending-up" },
            { label: `Chi phí vận hành (${ccy})`, value: money(tex), icon: "wallet" },
            { label: "Số giao dịch", value: String(inc.length + exp.length), icon: "check-circle" },
          ].map(rptKpi).join("")}</div>
    <div class="rpt-split">
      <article class="card">
        <div class="card-head">
          <div>
            <h3 class="section-title">Xu hướng Tài chính</h3>
            <p class="muted">Doanh thu và chi phí theo kỳ đã chọn · ${ccy}</p>
          </div>
          <div class="legend">
            <span><i class="dot" style="background:#2563EB"></i>Doanh thu</span>
            <span><i class="dot" style="background:#F43F5E"></i>Chi phí</span>
          </div>
        </div>
        <div class="chart-wrap rpt-trend"><canvas id="rBar"></canvas></div>
      </article>
      <article class="card">
        <h3 class="section-title">Cơ cấu Doanh mục</h3>
        <p class="muted" style="margin-bottom:12px">Tỷ trọng doanh thu theo nhóm sản phẩm</p>
        <div class="donut-row">
          <div class="chart-donut"><canvas id="pieChart"></canvas></div>
          <div class="donut-legend-side">
            ${incomeByCat(inc)
              .map((d, i) => {
                const colors = ["#1D4ED8", "#22C55E", "#22D3EE", "#A3E635", "#F59E0B"];
                const pct = tin ? Math.round((d.amount / tin) * 100) : 0;
                return `<div><span><i class="swatch" style="background:${colors[i % colors.length]}"></i>${d.name}</span><b>${pct}% · ${money(d.amount)}</b></div>`;
              })
              .join("") || `<div class="muted">Chưa có dữ liệu</div>`}
          </div>
        </div>
      </article>
    </div>
    <div class="rpt-split">
      <article class="card" style="padding:0">
        <div class="card-head" style="padding:16px 16px 8px">
          <div>
            <h3 class="section-title">Sản phẩm Bán chạy</h3>
            <p class="muted">Danh sách các mặt hàng đóng góp doanh thu lớn nhất</p>
          </div>
          <button class="link" type="button">Xem tất cả</button>
        </div>
        <div class="table-wrap"><table class="rpt-table">
          <thead><tr><th>Tên sản phẩm</th><th class="amount">SL</th><th class="amount">Doanh thu</th><th>Mã đơn</th></tr></thead>
          <tbody>${[...inc]
            .sort((a, b) => Number(b.amount) - Number(a.amount))
            .slice(0, 5)
            .map(
              (p) => `<tr>
              <td>${p.description}</td>
              <td class="amount muted">${p.productQty || "—"}</td>
              <td class="amount">${money(p.amount)}</td>
              <td class="amount muted">${p.orderCode || "—"}</td>
            </tr>`
            )
            .join("") || `<tr><td colspan="4"><div class="empty">Chưa có khoản thu.</div></td></tr>`}</tbody>
        </table></div>
      </article>
      <article class="card rpt-files">
        <div class="card-head" style="margin-bottom:10px">
          <h3 class="section-title">Báo cáo gần đây</h3>
          ${lucideI("file-text")}
        </div>
        <div class="rpt-cover">
          <img src="${IMG_REPORT}" alt="" />
          <span>Phân tích chuyên sâu Q2</span>
        </div>
        ${UI_MOCK.files
          .map(
            (f) => `<div class="file-row">
            <span class="file-ico">${lucideI(f.icon || "file-text")}</span>
            <div class="file-meta"><b>${f.title}</b><small>${f.date} &gt; ${f.type}</small></div>
          </div>`
          )
          .join("")}
        <button class="link rpt-download-all" type="button">Tải xuống tất cả lưu trữ ${lucideI("arrow-right")}</button>
      </article>
    </div>
    <div class="tip-banner">
      <div class="tip-copy">
        <span class="tip-ico">${lucideI("info")}</span>
        <div>
          <b>Mẹo quản lý tài chính</b>
          <p>Hãy thường xuyên kiểm tra tỷ trọng chi phí nguyên liệu so với doanh thu. Nếu con số này vượt quá 35%, bạn nên xem xét lại nguồn cung hoặc điều chỉnh giá bán của các mặt hàng handmade để đảm bảo biên lợi nhuận bền vững.</p>
        </div>
      </div>
      <div class="head-actions">
        <button class="btn ghost sm" type="button">${lucideI("printer")} In bản tóm tắt</button>
        <button class="btn ghost sm" type="button">${lucideI("share-2")} Chia sẻ</button>
      </div>
    </div>`
    }`;
};

function reportsTables() {
  const { inc, exp } = reportRows();
  const days = {};
  inc.forEach((x) => {
    days[x.incomeDate] = days[x.incomeDate] || { d: x.incomeDate, income: 0, expense: 0 };
    days[x.incomeDate].income += x.amount;
  });
  exp.forEach((x) => {
    days[x.expenseDate] = days[x.expenseDate] || { d: x.expenseDate, income: 0, expense: 0 };
    days[x.expenseDate].expense += x.amount;
  });
  const daily = Object.values(days).sort((a, b) => a.d.localeCompare(b.d));
  const monthly = monthlyFrom(inc, exp);
  if (reportTab === "daily") {
    return `<article class="card" style="padding:0"><div class="table-wrap"><table>
      <thead><tr><th>Ngày</th><th class="amount">Thu</th><th class="amount">Chi</th><th class="amount">Chênh lệch</th></tr></thead>
      <tbody>${daily.length ? daily.map((x) => `<tr><td>${dmy(x.d)}</td><td class="amount plus">${money(x.income)}</td><td class="amount minus">${money(x.expense)}</td><td class="amount">${money(x.income - x.expense)}</td></tr>`).join("") : `<tr><td colspan="4"><div class="empty">Không có dữ liệu.</div></td></tr>`}</tbody></table></div></article>`;
  }
  return `<article class="card" style="padding:0"><div class="table-wrap"><table>
    <thead><tr><th>Tháng</th><th class="amount">Thu</th><th class="amount">Chi</th><th class="amount">Chênh lệch</th></tr></thead>
    <tbody>${monthly.length ? monthly.map((x) => `<tr><td>${x.m}/${x.key.slice(0, 4)}</td><td class="amount plus">${money(x.income)}</td><td class="amount minus">${money(x.expense)}</td><td class="amount">${money(x.income - x.expense)}</td></tr>`).join("") : `<tr><td colspan="4"><div class="empty">Không có dữ liệu.</div></td></tr>`}</tbody></table></div></article>`;
}

importPage = function () {
  return `
    ${pageHead(
      "Import Dữ liệu Excel",
      "Tải lên các tệp tài chính của bạn để cập nhật hệ thống nhanh chóng.",
      `<a class="btn ghost" href="samples/mau-khoan-thu.xlsx" download>${lucideI("download")} Tải file mẫu (.xlsx)</a>
       <button class="btn ghost" type="button">${lucideI("circle-help")} Hướng dẫn</button>`
    )}
    <div class="seg-tabs">
      <button class="tab ${importTab === "flow" ? "on" : ""}" data-import-tab="flow">Quy trình Import</button>
      <button class="tab ${importTab === "hist" ? "on" : ""}" data-import-tab="hist">${lucideI("history")} Lịch sử thực hiện</button>
    </div>
    ${
      importTab === "flow"
        ? `<div class="steps">
      <div class="step on"><b>1</b>Tải tệp lên</div>
      <div class="steps-line"></div>
      <div class="step"><b>2</b>Xác thực dữ liệu</div>
      <div class="steps-line"></div>
      <div class="step"><b>3</b>Hoàn tất</div>
    </div>
    <div class="grid-30-70">
      <article class="card">
        <img class="cover-img" src="${IMG_IMPORT}" alt="" />
        <h3 class="section-title">Mẹo Import dữ liệu</h3>
        <p class="muted" style="margin-top:4px">Để quy trình diễn ra trôi chảy nhất:</p>
        <ul class="tip-list">
          <li>${lucideI("circle-check")} Sử dụng tệp mẫu được cung cấp để đảm bảo cấu trúc cột chính xác.</li>
          <li>${lucideI("circle-check")} Đảm bảo các cột ngày tháng và số tiền ở đúng định dạng.</li>
          <li>${lucideI("circle-check")} Dữ liệu trùng lặp sẽ được hệ thống cảnh báo trước khi lưu.</li>
        </ul>
      </article>
      <article class="card">
        <h3 class="section-title">Tải tệp dữ liệu</h3>
        <p class="muted" style="margin-bottom:12px">Chọn tệp Excel chứa dữ liệu thu chi hoặc danh sách khách hàng của bạn.</p>
        <div class="radio-row" style="margin-bottom:12px">
          <label class="choice"><input type="radio" name="itype" value="INCOME" checked /> Khoản thu</label>
          <label class="choice"><input type="radio" name="itype" value="EXPENSE" /> Khoản chi</label>
        </div>
        <label class="dropzone">
          <input type="file" id="xlsx" accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          <span class="kpi-ico blue" style="position:static">${lucideI("upload")}</span>
          <b>Nhấn để tải lên hoặc kéo thả</b>
          <small>Hỗ trợ các định dạng .xlsx, .xls hoặc .csv. Dung lượng tối đa 10MB.</small>
          <span class="btn ghost" style="pointer-events:none">${lucideI("folder-open")} Chọn tệp từ máy tính</span>
          <span class="muted" id="file-name">Chưa chọn tệp</span>
        </label>
        <button class="btn primary" id="do-import" style="margin-top:16px">Bắt đầu Import</button>
        <div id="import-status" style="margin-top:12px"></div>
      </article>
    </div>
    <article class="card" id="preview-card" style="display:none">
      <div class="card-head"><h3 class="section-title">Xem trước dữ liệu (mock)</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>STT</th><th>Ngày</th><th>Nội dung</th><th>Mã đơn</th><th class="amount">Order total</th><th>Trạng thái</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>13/09/2026</td><td>Lily Flower</td><td>4154185113</td><td class="amount plus">22.10</td><td><span class="badge ok">Hợp lệ</span></td></tr>
          <tr><td>2</td><td>10/09/2026</td><td>Dòng mẫu 2</td><td>—</td><td class="amount plus">120.00</td><td><span class="badge ok">Hợp lệ</span></td></tr>
        </tbody>
      </table></div>
    </article>`
        : `<article class="card" style="padding:0"><div class="table-wrap"><table>
        <thead><tr><th>Tệp</th><th>Loại</th><th>Thời gian</th><th>Kết quả</th></tr></thead>
        <tbody>${IMPORTS.map(
          (b) => `<tr><td><b>${b.fileName}</b></td><td>${b.type === "INCOME" ? "Khoản thu" : "Khoản chi"}</td><td>${b.createdAt}</td>
          <td><span class="badge ${b.status === "COMPLETED" ? "ok" : "fail"}">${b.status === "COMPLETED" ? "Hoàn thành" : "Thất bại"}</span></td></tr>`
        ).join("")}</tbody></table></div></article>`
    }`;
};

auditPage = function () {
  const live = AUDIT_LOGS.map((a) => ({
    id: "LOG-" + String(a.id).padStart(3, "0"),
    user: userName(a.userId),
    role: roleUi(USERS.find((u) => u.id === a.userId)?.role),
    initial: initials(userName(a.userId)),
    action: a.action.includes("Import") ? "import" : a.action.includes("Xóa") ? "delete" : a.action.includes("Sửa") ? "update" : "create",
    module: a.target,
    detail: a.detail,
    time: a.time.replace(" ", "\n"),
  }));
  const rows = [...live, ...UI_AUDIT];
  const actBadge = (k, label) => {
    const map = {
      login: ["neutral", "Đăng nhập", "log-in"],
      create: ["ok", "Tạo mới", "plus"],
      update: ["info", "Cập nhật", "refresh-cw"],
      import: ["warn", "Nhập file", "upload"],
      delete: ["fail", "Xóa", "trash-2"],
      export: ["ok", "Xuất file", "download"],
    };
    const m = map[k] || ["info", label || k, "activity"];
    return `<span class="badge ${m[0]}">${lucideI(m[2], 12)} ${m[1]}</span>`;
  };
  return `
    ${pageHead(
      "Nhật ký hoạt động",
      "Theo dõi và giám sát tất cả các thao tác của người dùng trên hệ thống HandmadeFinance.",
      `<button class="btn ghost" type="button">${lucideI("download")} Xuất Log (Excel)</button>
       <button class="btn primary" type="button" id="refresh-audit">${lucideI("refresh-cw")} Làm mới</button>`
    )}
    <div class="kpis">${UI_MOCK.auditKpis.map(kpiCard).join("")}</div>
    <div class="toolbar">
      <label class="search-box toolbar-search">${lucideI("search")}<input id="q" type="search" placeholder="Tìm kiếm hành động hoặc người dùng..." /></label>
      <select id="fAct" class="toolbar-ctrl"><option value="">Hành động: Tất cả</option></select>
      <select id="fUser" class="toolbar-ctrl"><option value="">Module: Tất cả</option>${USERS.map((u) => `<option value="${u.id}">${u.name}</option>`).join("")}</select>
      <span class="pill">${lucideI("calendar")} Hôm nay, 20/05</span>
      <button class="icon-btn" type="button">${lucideI("filter")}</button>
    </div>
    <article class="card" style="padding:0">
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Người thực hiện</th><th>Hành động</th><th>Phân mục</th><th>Mô tả chi tiết</th><th>Thời gian</th></tr></thead>
        <tbody id="rows">${rows
          .map(
            (a) => `<tr data-user="" data-act="${a.action}" data-text="${(a.action + a.detail + a.user).toLowerCase()}">
            <td class="muted">${a.id}</td>
            <td><div class="user-cell"><span class="avatar">${a.initial}</span><div class="meta"><b>${a.user}</b><small>${a.role || ""}</small></div></div></td>
            <td>${actBadge(a.action, a.action)}</td>
            <td>${a.module}</td>
            <td>${a.detail}</td>
            <td class="muted" style="white-space:pre-line">${a.time}</td>
          </tr>`
          )
          .join("")}</tbody>
      </table></div>
      <div class="pager"><span class="muted">Hiển thị 1 - ${Math.min(8, rows.length)} trên tổng số 1,248 bản ghi</span>
        <div class="pager-pages">
          <button class="btn ghost pager-btn" disabled>Trước</button>
          <button class="btn primary pager-btn">1</button>
          <button class="btn ghost pager-btn">2</button>
          <button class="btn ghost pager-btn">3</button>
          <span class="muted">...</span>
          <button class="btn ghost pager-btn">125</button>
          <button class="btn ghost pager-btn">Sau</button>
        </div>
      </div>
    </article>
    <div class="grid-70-30">
      <article class="card">
        <h3 class="section-title">${lucideI("shield-check")} Chính sách lưu trữ nhật ký</h3>
        <p class="muted" style="margin:8px 0 10px">Hệ thống HandmadeFinance tự động ghi lại mọi thao tác tác động đến cơ sở dữ liệu. Nhật ký được lưu trữ an toàn trong vòng 180 ngày để phục vụ công tác đối soát và bảo mật.</p>
        <ul class="policy">
          <li>Thông tin IP và thiết bị đăng nhập được mã hóa.</li>
          <li>Mọi thay đổi được gán với một định danh duy nhất.</li>
          <li>Thao tác xóa dữ liệu luôn yêu cầu xác thực cấp 2.</li>
          <li>Log hệ thống không thể bị xóa bởi nhân viên.</li>
        </ul>
      </article>
      <article class="card security-card">
        <div>
          <h3>Báo cáo bảo mật</h3>
          <p>Cần xem chi tiết hành vi bất thường trong hệ thống? Tải ngay báo cáo phân tích bảo mật tuần qua.</p>
        </div>
        <button class="btn" type="button">Tải báo cáo phân tích</button>
      </article>
    </div>`;
};

usersPage = function () {
  if (userFilterTab === "pending") userFilterTab = "disabled";
  UI_USERS.forEach((x) => {
    if (USERS.some((u) => u.email === x.email || u.id === x.id)) return;
    USERS.push({
      id: x.id,
      name: x.name,
      email: x.email,
      password: "123456",
      role: x.role,
      status: x.status === "active" ? "active" : "disabled",
      avatar: x.photo || "",
    });
  });
  const lastOf = (u) => UI_USERS.find((x) => x.email === u.email)?.last || "Vừa xong";
  const photoOf = (u) => u.avatar || UI_USERS.find((x) => x.email === u.email)?.photo || `https://i.pravatar.cc/64?u=${u.id}`;
  const q = (userQuery || "").trim().toLowerCase();
  const rows = USERS.filter((u) => {
    const active = u.status === "active";
    if (userFilterTab === "active" && !active) return false;
    if (userFilterTab === "disabled" && active) return false;
    if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const total = USERS.length;
  const nAdmin = USERS.filter((u) => u.role === "ADMIN").length;
  const nActive = USERS.filter((u) => u.status === "active").length;
  const nOff = total - nActive;
  const kpis = [
    { label: "Tổng số", value: String(total), icon: "users", tone: "blue" },
    { label: "Quản trị", value: String(nAdmin), icon: "shield", tone: "indigo" },
    { label: "Hoạt động", value: String(nActive), icon: "check-circle", tone: "green" },
    { label: "Ngừng kích hoạt", value: String(nOff), icon: "power", tone: "orange" },
  ];
  const stBadge = (s) =>
    s === "active"
      ? `<span class="badge ok">${lucideI("check-circle", 12)} Đang hoạt động</span>`
      : `<span class="badge fail">${lucideI("circle-off", 12)} Ngừng kích hoạt</span>`;
  return `
    ${pageHead(
      "Quản lý người dùng",
      "Quản lý quyền truy cập, vai trò và trạng thái của các thành viên trong hệ thống.",
      `<button class="btn ghost" type="button">${lucideI("download")} Xuất dữ liệu</button>
       <button class="btn primary" type="button" id="open-user-modal">${lucideI("plus")} Thêm người dùng</button>`
    )}
    <div class="kpis">${kpis.map(kpiCard).join("")}</div>
    <div class="toolbar">
      <label class="search-box toolbar-search">${lucideI("search")}<input id="q" type="search" placeholder="Tìm theo tên hoặc email..." value="${userQuery || ""}" /></label>
      <div class="seg-tabs">
        <button class="tab ${userFilterTab === "all" ? "on" : ""}" data-user-tab="all">Tất cả</button>
        <button class="tab ${userFilterTab === "active" ? "on" : ""}" data-user-tab="active">Hoạt động</button>
        <button class="tab ${userFilterTab === "disabled" ? "on" : ""}" data-user-tab="disabled">Ngừng kích hoạt</button>
      </div>
      <button class="btn ghost" type="button">${lucideI("sliders-horizontal")} Bộ lọc nâng cao</button>
    </div>
    <article class="card" style="padding:0">
      <div class="table-wrap"><table class="users-table">
        <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Hoạt động gần nhất</th><th>Thao tác</th></tr></thead>
        <tbody>${rows
          .map((u) => {
            const active = u.status === "active";
            return `<tr>
            <td><div class="user-cell"><span class="avatar"><img src="${photoOf(u)}" alt="" /></span>
              <div class="meta"><b>${u.name}</b><small>${u.email}</small></div></div></td>
            <td>${rolePill(u.role)}</td>
            <td>${stBadge(active ? "active" : "disabled")}</td>
            <td class="muted">${lastOf(u)}</td>
            <td><div class="row-actions">
              <button class="icon-btn" data-toggle="${u.id}" title="${active ? "Ngừng kích hoạt" : "Kích hoạt lại"}">${lucideI("power")}</button>
              <button class="icon-btn" data-edit-user="${u.id}" title="Sửa">${lucideI("pencil")}</button>
            </div></td>
          </tr>`;
          })
          .join("")}</tbody>
      </table></div>
      <div class="pager"><span class="muted">Hiển thị 1 - ${rows.length} trong số ${total} người dùng</span>
        <div class="pager-pages"><button class="btn ghost pager-btn" disabled>Trước</button><button class="btn primary pager-btn">1</button><button class="btn ghost pager-btn" disabled>Sau</button></div>
      </div>
    </article>
    <div class="role-cards">
      <article class="card"><h3>${lucideI("shield")} Quản trị viên</h3><p class="muted">Quyền hạn cao nhất. Có thể quản lý người dùng, thiết lập hệ thống, xem báo cáo và chỉnh sửa tất cả dữ liệu thu chi.</p></article>
      <article class="card"><h3>${lucideI("pencil")} Nhân viên</h3><p class="muted">Quản lý vận hành. Có thể thêm mới, chỉnh sửa các khoản thu chi và xem báo cáo cơ bản. Không thể quản lý người dùng.</p></article>
      <article class="card"><h3>${lucideI("eye")} Người xem</h3><p class="muted">Chỉ đọc. Chỉ có quyền xem danh sách và báo cáo. Không thể thêm mới, chỉnh sửa hoặc xuất bất kỳ dữ liệu nào.</p></article>
    </div>`;
};

profilePage = function () {
  const u = currentUser();
  const tabs = [
    ["account", "Tài khoản"],
    ["security", "Bảo mật"],
    ["roles", "Vai trò & Quyền hạn"],
  ];
  if (profileTab === "notify") profileTab = "account";
  const displayName = u.role === "ADMIN" ? UI_MOCK.displayName : u.name;
  const displayEmail = u.email === "admin@demo.local" ? "nguyen.handmade@finance.vn" : u.email;
  const roleLine = u.role === "ADMIN" ? "Quản trị viên hệ thống" : u.role === "SHOP_OWNER" ? "Chủ cửa hàng" : roleUi(u.role);
  const uid = `#${(u.role === "ADMIN" ? "ADM" : u.role === "SHOP_OWNER" ? "OWN" : u.role === "EMPLOYEE" ? "EMP" : "VEW")}-${String(u.id).padStart(3, "0")}`;
  const phone = u.phone || "090 123 4567";
  const saveForm = profileTab === "security" ? "security-form" : "profile-form";
  const saveLabel = profileTab === "security" ? "Lưu mật khẩu" : "Lưu thay đổi";
  const headActions = `<button class="btn ghost" type="button" data-go="dashboard">Hủy bỏ</button>
       ${profileTab === "roles" ? "" : `<button class="btn primary" type="submit" form="${saveForm}">${lucideI("save")} ${saveLabel}</button>`}`;
  const account = `
    <div class="profile-account">
      <div class="profile-grid">
        <article class="card profile-side">
          <div class="avatar-wrap">
            <span class="avatar lg" id="profile-avatar-preview"><img src="${u.avatar || AVATAR_ADMIN}" alt="" /></span>
            <button class="cam-btn" type="button" id="pick-avatar" title="Đổi ảnh">${lucideI("camera", 12)}</button>
          </div>
          <div class="avatar-picker" id="avatar-picker">
            <p>Đổi ảnh đại diện</p>
            <button class="btn ghost sm avatar-file-btn" type="button" id="avatar-browse">${lucideI("image")} Chọn ảnh từ máy</button>
            <input id="avatar-file" type="file" accept="image/*" hidden />
            <label class="field"><span>Hoặc dán URL ảnh</span><input id="avatar-url" type="url" placeholder="https://..." value="${u.avatar && String(u.avatar).startsWith("http") ? u.avatar : ""}" /></label>
            <button class="btn primary sm" type="button" id="avatar-apply" style="margin-top:8px;width:100%">Dùng ảnh này</button>
          </div>
          <h3>${displayName}</h3>
          <p class="muted">${roleLine}</p>
          <p class="profile-badges"><span class="badge ok">Hoạt động</span> <span class="badge info">ID: ${uid}</span></p>
          <div class="profile-meta">
            <div>${lucideI("building-2")} <span>Tham gia từ: <b>15/01/2024</b></span></div>
            <div>${lucideI("globe")} <span>Múi giờ: <b>(GMT+7) Hồ Chí Minh</b></span></div>
          </div>
        </article>
        <article class="card profile-detail">
          <h3 class="section-title">Chi tiết cá nhân</h3>
          <p class="muted profile-lead">Cập nhật thông tin liên hệ và định danh của bạn.</p>
          <form id="profile-form">
            <div class="form-grid">
              <label class="field"><span class="lab">${lucideI("user")} Họ và tên</span><input name="name" value="${displayName}" required /></label>
              <label class="field"><span class="lab">${lucideI("mail")} Địa chỉ Email</span><input name="emailShow" value="${displayEmail}" disabled /></label>
              <label class="field"><span class="lab">${lucideI("phone")} Số điện thoại</span><input name="phone" value="${phone}" /></label>
              <label class="field"><span class="lab">${lucideI("briefcase")} Chức vụ</span><input value="${roleUi(u.role)}" disabled /></label>
              <input type="hidden" name="avatar" value="${u.avatar || ""}" />
            </div>
            <p class="profile-hint">${lucideI("info")} Thông tin này sẽ hiển thị trên nhật ký hoạt động của hệ thống.</p>
          </form>
        </article>
      </div>
    </div>`;
  const security = `
    <article class="card">
      <h3 class="section-title">Đổi mật khẩu</h3>
      <p class="muted" style="margin-bottom:14px">Dùng mật khẩu mạnh, không chia sẻ với người khác.</p>
      <form id="security-form">
        <div class="form-grid">
          <label class="field span-2"><span>Mật khẩu hiện tại</span><input name="current" type="password" required placeholder="••••••••" /></label>
          <label class="field"><span>Mật khẩu mới</span><input name="next" type="password" required minlength="4" placeholder="Tối thiểu 4 ký tự" /></label>
          <label class="field"><span>Xác nhận mật khẩu mới</span><input name="confirm" type="password" required minlength="4" /></label>
        </div>
      </form>
    </article>`;
  const permRows = [
    ["dashboard", "Dashboard"],
    ["incomeRead", "Xem khoản thu"],
    ["incomeCreate", "Thêm / sửa khoản thu"],
    ["expenseRead", "Xem khoản chi"],
    ["expenseCreate", "Thêm / sửa khoản chi"],
    ["reportRead", "Xem báo cáo"],
    ["importData", "Import Excel"],
    ["auditRead", "Nhật ký hoạt động"],
    ["userManagement", "Quản lý người dùng"],
  ];
  const roles = `
    <div class="profile-stack">
      <article class="card">
        <h3 class="section-title">Vai trò hiện tại</h3>
        <p class="muted" style="margin-bottom:12px">Vai trò do quản trị viên gán. Bạn không tự đổi quyền tại đây.</p>
        <div class="current-role">${rolePill(u.role)}<span class="muted">${roleLine}</span></div>
      </article>
      <article class="card" style="padding:0">
        <div class="card-head" style="padding:16px 16px 8px"><h3 class="section-title">Ma trận quyền hạn</h3></div>
        <div class="table-wrap"><table class="perm-table">
          <thead><tr><th>Chức năng</th><th>Quyền của bạn</th></tr></thead>
          <tbody>${permRows
            .map(([k, l]) => {
              const ok = can(k);
              return `<tr><td>${l}</td><td>${ok ? `<span class="badge ok">${lucideI("check", 12)} Được phép</span>` : `<span class="badge fail">${lucideI("x", 12)} Không có</span>`}</td></tr>`;
            })
            .join("")}</tbody>
        </table></div>
      </article>
      <div class="role-cards">
        <article class="card"><h3>${lucideI("shield")} Quản trị viên</h3><p class="muted">Toàn quyền hệ thống, gồm người dùng và nhật ký.</p></article>
        <article class="card"><h3>${lucideI("store")} Chủ shop</h3><p class="muted">Quản lý thu chi, báo cáo, import. Không quản lý người dùng.</p></article>
        <article class="card"><h3>${lucideI("pencil")} Nhân viên</h3><p class="muted">Thêm / sửa giao dịch của mình. Không xem báo cáo tổng.</p></article>
      </div>
    </div>`;
  const body = profileTab === "security" ? security : profileTab === "roles" ? roles : account;
  return `
    ${pageHead("Hồ sơ cá nhân", "Quản lý thông tin định danh, bảo mật và quyền hạn truy cập hệ thống.", headActions)}
    <div class="profile-tabs">${tabs.map(([k, l]) => `<button type="button" class="tab ${profileTab === k ? "on" : ""}" data-profile-tab="${k}">${l}</button>`).join("")}</div>
    ${body}`;
};

drawDash = function () {
  const canvas = document.getElementById("barChart");
  if (!canvas || typeof Chart === "undefined") return;
  const inc = filteredIncomes().filter((x) => inRange(x.incomeDate, dashFrom, dashTo));
  const exp = filteredExpenses().filter((x) => inRange(x.expenseDate, dashFrom, dashTo));
  const monthly = monthlyFrom(inc, exp);
  const unit = ccy === "EUR" ? "€" : "$";
  charts.bar = new Chart(canvas, {
    type: "line",
    data: {
      labels: monthly.length ? monthly.map((x) => x.m) : ["Không có dữ liệu"],
      datasets: [
        {
          label: "Thu",
          data: monthly.map((x) => toDisplay(x.income)),
          borderColor: "#0866D9",
          backgroundColor: "rgba(8,102,217,0.22)",
          fill: "origin",
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          label: "Chi",
          data: monthly.map((x) => toDisplay(x.expense)),
          borderColor: "#F43F5E",
          backgroundColor: "rgba(244,63,94,0.16)",
          fill: "origin",
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    },
    options: {
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(monthly[ctx.dataIndex] ? (ctx.dataset.label === "Thu" ? monthly[ctx.dataIndex].income : monthly[ctx.dataIndex].expense) : 0)}` },
        },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "#EEF1F4" }, ticks: { font: { size: 10 }, callback: (v) => unit + v } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      },
      maintainAspectRatio: false,
    },
  });
};

drawReports = function () {
  const { inc, exp } = reportRows();
  const unit = ccy === "EUR" ? "€" : "$";
  if (reportTab === "overview") {
    const monthly = monthlyFrom(inc, exp);
    const el = document.getElementById("rBar");
    if (el) {
      charts.rBar = new Chart(el, {
        type: "line",
        data: {
          labels: monthly.length ? monthly.map((x) => x.m) : ["Không có dữ liệu"],
          datasets: [
            {
              label: "Doanh thu",
              data: monthly.map((x) => toDisplay(x.income)),
              borderColor: "#2563EB",
              backgroundColor: "rgba(37,99,235,0.16)",
              fill: "origin",
              tension: 0.42,
              pointRadius: 3,
              borderWidth: 2.5,
            },
            {
              label: "Chi phí",
              data: monthly.map((x) => toDisplay(x.expense)),
              borderColor: "#F43F5E",
              backgroundColor: "rgba(244,63,94,0.10)",
              fill: "origin",
              tension: 0.42,
              pointRadius: 3,
              borderWidth: 2.5,
            },
          ],
        },
        options: {
          animation: { duration: 350 },
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const row = monthly[ctx.dataIndex];
                  const raw = ctx.dataset.label === "Doanh thu" ? row?.income : row?.expense;
                  return `${ctx.dataset.label}: ${money(raw || 0)}`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#EEF1F4", drawBorder: false },
              ticks: { font: { size: 10 }, color: "#9AA3AF", callback: (v) => unit + v },
            },
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#9AA3AF" } },
          },
          maintainAspectRatio: false,
        },
      });
    }
    const pie = document.getElementById("pieChart");
    const cats = incomeByCat(inc);
    if (pie && cats.length) {
      const colors = ["#1D4ED8", "#22C55E", "#22D3EE", "#A3E635", "#F59E0B"];
      charts.pie = new Chart(pie, {
        type: "doughnut",
        data: {
          labels: cats.map((d) => d.name),
          datasets: [{ data: cats.map((d) => toDisplay(d.amount)), backgroundColor: cats.map((_, i) => colors[i % colors.length]), borderWidth: 0 }],
        },
        options: {
          plugins: { legend: { display: false } },
          cutout: "62%",
          animation: { duration: 350 },
          maintainAspectRatio: false,
        },
      });
    }
  }
  const doughnut = (id, labels, data) => {
    const el = document.getElementById(id);
    if (!el || !data.length) return;
    charts[id] = new Chart(el, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: ["#0866D9", "#22C55E", "#F43F5E", "#F59E0B", "#06B6D4"], borderWidth: 0 }] },
      options: { plugins: { legend: { display: false } }, cutout: "70%", maintainAspectRatio: false },
    });
  };
  if (reportTab === "in") doughnut("rIn", incomeByCat(inc).map((x) => x.name), incomeByCat(inc).map((x) => toDisplay(x.amount)));
  if (reportTab === "out") doughnut("rOut", expenseByCat(exp).map((x) => x.name), expenseByCat(exp).map((x) => toDisplay(x.amount)));
};

function expenseModalEl() {
  let el = document.getElementById("expense-detail-modal");
  if (!el) {
    el = document.createElement("div");
    el.id = "expense-detail-modal";
    el.className = "modal-back";
    el.innerHTML = `<div class="exp-modal" id="expense-detail-body"></div>`;
    document.body.appendChild(el);
  }
  if (!document.getElementById("expense-detail-body")) {
    el.innerHTML = `<div class="exp-modal" id="expense-detail-body"></div>`;
  }
  return el;
}

function openRecordDetail(kind, id) {
  const isIncome = kind === "income";
  const list = isIncome ? INCOMES : EXPENSES;
  const rec = list.find((x) => x.id === Number(id) && isActive(x)) || list.find((x) => x.id === Number(id)) || null;
  const modal = expenseModalEl();
  const body = document.getElementById("expense-detail-body");
  if (!body) return;
  document.getElementById("record-form-modal")?.classList.remove("open");
  body.innerHTML = recordDetailHtml(kind, rec);
  modal.classList.add("open");
  refreshIcons();
  const close = () => modal.classList.remove("open");
  document.getElementById("close-exp-modal")?.addEventListener("click", close);
  document.getElementById("close-exp-modal-2")?.addEventListener("click", close);
  document.getElementById("exp-confirm")?.addEventListener("click", () => {
    toast(isIncome ? "Đã xác nhận đối soát (mock)" : "Đã xác nhận thanh toán (mock)");
    close();
  });
  document.getElementById("exp-draft")?.addEventListener("click", () => toast("Đã lưu nháp (mock)"));
  document.getElementById("detail-edit")?.addEventListener("click", () => {
    if (!rec) return;
    close();
    go(isIncome ? "income-edit" : "expense-edit", rec.id);
  });
}

function openExpenseDetail(id) {
  openRecordDetail("expense", id);
}

function bindUiExtras() {
  document.getElementById("toggle-report-filters")?.addEventListener("click", () => {
    reportFilterOpen = !reportFilterOpen;
    renderApp();
  });
  document.querySelectorAll("[data-import-tab]").forEach((b) => {
    b.onclick = () => {
      importTab = b.dataset.importTab;
      renderApp();
    };
  });
  document.querySelectorAll("[data-profile-tab]").forEach((b) => {
    b.onclick = () => {
      profileTab = b.dataset.profileTab;
      renderApp();
    };
  });
  document.querySelectorAll("[data-user-tab]").forEach((b) => {
    b.onclick = () => {
      userFilterTab = b.dataset.userTab;
      renderApp();
    };
  });
  const userSearch = document.getElementById("q");
  if (page === "users" && userSearch) {
    userSearch.oninput = () => {
      userQuery = userSearch.value || "";
      renderApp();
      const n = document.getElementById("q");
      if (n) {
        n.focus();
        try {
          n.setSelectionRange(n.value.length, n.value.length);
        } catch (_) {}
      }
    };
  }
  document.getElementById("refresh-audit")?.addEventListener("click", () => {
    toast("Đã làm mới nhật ký");
    renderApp();
  });
  document.getElementById("logout-all")?.addEventListener("click", () => toast("Đã đăng xuất khỏi các thiết bị khác (mock)"));
  document.getElementById("disable-acc")?.addEventListener("click", () => openConfirm("Vô hiệu hóa tài khoản? Thao tác mô phỏng.", () => toast("Đã gửi yêu cầu (mock)")));
  document.getElementById("export-dash")?.addEventListener("click", () => toast("Xuất dữ liệu biểu đồ (mock)"));
  const picker = document.getElementById("avatar-picker");
  const hiddenAv = document.querySelector('#profile-form [name="avatar"]');
  const previewAv = document.querySelector("#profile-avatar-preview img");
  const setAvatar = (src) => {
    if (hiddenAv) hiddenAv.value = src;
    if (previewAv) previewAv.src = src;
  };
  document.getElementById("pick-avatar")?.addEventListener("click", () => picker?.classList.toggle("open"));
  document.getElementById("avatar-browse")?.addEventListener("click", () => document.getElementById("avatar-file")?.click());
  document.getElementById("avatar-file")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result || ""));
      toast("Đã chọn ảnh. Bấm Lưu thay đổi để cập nhật.");
    };
    reader.readAsDataURL(f);
  });
  document.getElementById("avatar-apply")?.addEventListener("click", () => {
    const url = String(document.getElementById("avatar-url")?.value || "").trim();
    if (!url) {
      toast("Nhập URL ảnh hoặc chọn file từ máy");
      return;
    }
    setAvatar(url);
    toast("Đã gắn ảnh. Bấm Lưu thay đổi để cập nhật.");
  });
  document.getElementById("security-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const cur = String(fd.get("current") || "");
    const next = String(fd.get("next") || "");
    const confirm = String(fd.get("confirm") || "");
    const full = USERS.find((x) => x.id === currentUser().id);
    if (cur !== full.password) {
      toast("Mật khẩu hiện tại không đúng");
      return;
    }
    if (next.length < 4 || next !== confirm) {
      toast("Mật khẩu mới không khớp hoặc quá ngắn");
      return;
    }
    full.password = next;
    toast("Đã cập nhật mật khẩu");
  });
  refreshIcons();
}

document.addEventListener("click", (e) => {
  const modal = document.getElementById("expense-detail-modal");
  if (modal && e.target === modal) modal.classList.remove("open");
  const formModal = document.getElementById("record-form-modal");
  if (formModal && e.target === formModal) closeRecordModal();
  if (e.target.closest("[data-edit-ex], [data-del-ex], [data-edit-in], [data-del-in]")) return;
  const ex = e.target.closest("[data-view-ex]");
  if (ex) {
    e.preventDefault();
    openRecordDetail("expense", Number(ex.dataset.viewEx));
    return;
  }
  const inc = e.target.closest("[data-view-in]");
  if (!inc) return;
  e.preventDefault();
  openRecordDetail("income", Number(inc.dataset.viewIn));
});

function closeRecordModal() {
  formModalKind = null;
  formModalEditId = null;
  document.getElementById("record-form-modal")?.classList.remove("open");
}

function openRecordModal(kind, id) {
  const isIncome = kind === "income";
  const rec = id
    ? isIncome
      ? INCOMES.find((x) => x.id === Number(id) && isActive(x))
      : EXPENSES.find((x) => x.id === Number(id) && isActive(x))
    : null;
  if (id && !rec) {
    toast("Không tìm thấy bản ghi");
    return;
  }
  formModalKind = kind;
  formModalEditId = rec ? rec.id : null;
  const typeLabel = isIncome ? "Khoản thu" : "Khoản chi";
  document.getElementById("record-form-kicker").innerHTML = rec
    ? `${lucideI("pencil")} Cập nhật <span class="muted">/</span> <span class="muted">${typeLabel}</span>`
    : `${lucideI("plus-circle")} Giao dịch mới <span class="muted">/</span> <span class="muted">${typeLabel}</span>`;
  document.getElementById("record-form-title").textContent = rec
    ? isIncome
      ? "Sửa khoản thu"
      : "Sửa khoản chi"
    : isIncome
      ? "Thêm khoản thu"
      : "Thêm khoản chi";
  document.getElementById("record-form-sub").textContent = rec
    ? "Chỉnh sửa thông tin, phân loại và chứng từ rồi lưu thay đổi."
    : "Nhập các trường bắt buộc. Chi tiết bổ sung có thể thêm sau.";
  document.getElementById("record-form-body").innerHTML = isIncome ? incomeForm(rec) : expenseForm(rec);
  const modal = document.getElementById("record-form-modal");
  modal.classList.add("open");
  document.getElementById("expense-detail-modal")?.classList.remove("open");
  document.getElementById("record-form-close").onclick = closeRecordModal;
  refreshIcons();
  bindRecordFormModal(isIncome, rec);
}

function bindRecordFormModal(isIncome, rec) {
  bindFormSections();
  bindIncomeFees();
  bindExpenseTax();
  document.getElementById("attach")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    const meta = document.getElementById("attach-meta");
    if (meta && f) meta.textContent = `${f.name} · ${f.type || "file"} · ${f.size} bytes`;
  });
  document.querySelectorAll("#record-form-modal [data-go]").forEach((el) => {
    el.onclick = (ev) => {
      ev.preventDefault();
      closeRecordModal();
    };
  });
  const form = document.getElementById("rec-form");
  if (!form) return;
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const now = new Date().toISOString();
    if (isIncome) {
      const row = {
        incomeDate: fd.get("incomeDate"),
        description: fd.get("description"),
        categoryId: Number(fd.get("categoryId")),
        amount: fromDisplayNum(fd.get("amount")),
        currency: "USD",
        referenceCode: fd.get("referenceCode"),
        orderCode: String(fd.get("orderCode") || "").trim(),
        saleRegion: String(fd.get("saleRegion") || ""),
        productQty: fd.get("productQty") ? Number(fd.get("productQty")) : null,
        unitPrice: fromDisplay(fd.get("unitPrice")),
        itemTotal: fromDisplay(fd.get("itemTotal")),
        discountAmount: fromDisplayNum(fd.get("discountAmount")),
        discountCode: String(fd.get("discountCode") || "").trim(),
        subtotal: fromDisplay(fd.get("subtotal")),
        shippingAmount: fromDisplayNum(fd.get("shippingAmount")),
        taxAmount: fromDisplayNum(fd.get("taxAmount")),
        taxPercent: Number(fd.get("taxPercent") || 0),
        amountAfterTax: afterTax(fromDisplayNum(fd.get("amount")), fd.get("taxPercent")),
        source: rec ? rec.source : "MANUAL",
        note: fd.get("note"),
        attachment: fileMeta(document.getElementById("attach")?.files?.[0], rec?.attachment || null),
        updatedAt: now,
      };
      if (formModalEditId) {
        const old = INCOMES.find((x) => x.id === formModalEditId);
        Object.assign(old, row, {
          createdBy: old.createdBy,
          createdAt: old.createdAt,
          deletedAt: old.deletedAt || null,
          deletedBy: old.deletedBy || null,
          attachment: row.attachment || old.attachment || null,
        });
        pushAudit("Sửa khoản thu", "Khoản thu", row.description);
        toast("Đã cập nhật khoản thu");
      } else {
        INCOMES.push({
          id: nextId(INCOMES),
          ...row,
          createdBy: currentUser().id,
          createdAt: now,
          deletedAt: null,
          deletedBy: null,
        });
        pushAudit("Tạo khoản thu", "Khoản thu", row.description);
        toast("Đã thêm khoản thu");
      }
      closeRecordModal();
      _go("incomes");
      return;
    }
    const row = {
      expenseDate: fd.get("expenseDate"),
      description: fd.get("description"),
      categoryId: Number(fd.get("categoryId")),
      amount: fromDisplayNum(fd.get("amount")),
      currency: "USD",
      recipient: fd.get("recipient"),
      originScope: String(fd.get("originScope") || "DOMESTIC"),
      taxPercent: Number(fd.get("taxPercent") || 0),
      amountAfterTax: afterTax(fromDisplayNum(fd.get("amount")), fd.get("taxPercent")),
      source: rec ? rec.source : "MANUAL",
      note: fd.get("note"),
      attachment: fileMeta(document.getElementById("attach")?.files?.[0], rec?.attachment || null),
      updatedAt: now,
    };
    if (formModalEditId) {
      const old = EXPENSES.find((x) => x.id === formModalEditId);
      Object.assign(old, row, {
        createdBy: old.createdBy,
        createdAt: old.createdAt,
        deletedAt: old.deletedAt || null,
        deletedBy: old.deletedBy || null,
        attachment: row.attachment || old.attachment || null,
      });
      pushAudit("Sửa khoản chi", "Khoản chi", row.description);
      toast("Đã cập nhật khoản chi");
    } else {
      EXPENSES.push({
        id: nextId(EXPENSES),
        ...row,
        createdBy: currentUser().id,
        createdAt: now,
        deletedAt: null,
        deletedBy: null,
      });
      pushAudit("Tạo khoản chi", "Khoản chi", row.description);
      toast("Đã thêm khoản chi");
    }
    closeRecordModal();
    _go("expenses");
  };
}

const _go = go;
go = function (p, id) {
  if (p === "income-form") return openRecordModal("income", null);
  if (p === "income-edit") return openRecordModal("income", id);
  if (p === "expense-form") return openRecordModal("expense", null);
  if (p === "expense-edit") return openRecordModal("expense", id);
  closeRecordModal();
  return _go(p, id);
};

const _renderApp = renderApp;
renderApp = function () {
  document.getElementById("expense-detail-modal")?.classList.remove("open");
  if (page === "income-form" || page === "income-edit") {
    const recId = page === "income-edit" ? editId : null;
    page = "incomes";
    _renderApp();
    bindUiExtras();
    openRecordModal("income", recId);
    return;
  }
  if (page === "expense-form" || page === "expense-edit") {
    const recId = page === "expense-edit" ? editId : null;
    page = "expenses";
    _renderApp();
    bindUiExtras();
    openRecordModal("expense", recId);
    return;
  }
  if (!formModalKind) closeRecordModal();
  _renderApp();
  bindUiExtras();
};

renderLogin = function () {
  setShell(false);
  destroyCharts();
  document.getElementById("login-root").innerHTML = `
    <div class="login-split">
      <section class="login-hero" aria-hidden="false">
        <div class="login-hero-brand">
          <span class="brand-mark">${lucideI("wallet")}</span>
          <strong>HandmadeFinance</strong>
        </div>
        <div class="login-hero-copy">
          <h1>Quản trị tài chính<br /><span>Chuyên nghiệp &amp; Tin cậy</span></h1>
          <p>Hệ thống quản lý dòng tiền toàn diện dành riêng cho các chủ cửa hàng đồ thủ công. Theo dõi doanh thu, tối ưu chi phí và bứt phá lợi nhuận với dữ liệu chính xác.</p>
          <div class="login-feats">
            <article>
              ${lucideI("shield-check")}
              <div>
                <b>Bảo mật tuyệt đối</b>
                <span>Dữ liệu tài chính của bạn được mã hóa và bảo vệ theo tiêu chuẩn quốc tế.</span>
              </div>
            </article>
            <article>
              ${lucideI("bar-chart-3")}
              <div>
                <b>Báo cáo thông minh</b>
                <span>Biểu đồ trực quan giúp bạn nắm bắt sức khỏe tài chính chỉ trong 30 giây.</span>
              </div>
            </article>
          </div>
        </div>
        <div class="login-hero-foot">
          <div class="login-avatars">
            <img src="https://i.pravatar.cc/40?img=32" alt="" />
            <img src="https://i.pravatar.cc/40?img=12" alt="" />
            <img src="https://i.pravatar.cc/40?img=47" alt="" />
            <img src="https://i.pravatar.cc/40?img=15" alt="" />
          </div>
          <span>Hơn 2,500+ chủ shop handmade tin dùng mỗi ngày.</span>
        </div>
      </section>
      <section class="login-panel">
        <form class="login-form" id="login-form">
          <h2>Chào mừng trở lại</h2>
          <p class="lead">Vui lòng nhập thông tin để truy cập hệ thống quản trị.</p>
          <div id="login-err"></div>
          <label class="field">
            <span>Email hoặc tài khoản</span>
            <span class="input-ico">
              ${lucideI("mail")}
              <input name="email" type="email" autocomplete="username" required placeholder="example@handmadeshop.vn" />
            </span>
          </label>
          <label class="field">
            <span class="pw-label"><span>Mật khẩu</span><button type="button" class="link" id="forgot-pw">Quên mật khẩu?</button></span>
            <span class="input-ico">
              ${lucideI("lock")}
              <input name="password" id="pw" type="password" autocomplete="current-password" required placeholder="••••••••" />
              <button type="button" class="pw-toggle" id="pw-toggle" aria-label="Hiện mật khẩu">${lucideI("eye")}</button>
            </span>
          </label>
          <label class="check"><input type="checkbox" name="remember" /> Ghi nhớ đăng nhập trên thiết bị này</label>
          <button class="btn primary login-submit" type="submit">Đăng nhập ${lucideI("chevron-right")}</button>
          <p class="login-signup">Chưa có tài khoản? <button type="button" class="link" id="go-signup">Đăng ký ngay</button></p>
          <p class="login-demo">Demo: admin@demo.local · owner@demo.local · staff@demo.local · viewer@demo.local — mật khẩu <code>123456</code></p>
        </form>
        <footer class="login-legal">
          <button type="button" class="link">Điều khoản dịch vụ</button>
          <button type="button" class="link">Chính sách bảo mật</button>
          <button type="button" class="link">Hỗ trợ kỹ thuật</button>
        </footer>
      </section>
    </div>`;
  document.getElementById("pw-toggle").onclick = () => {
    const inp = document.getElementById("pw");
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    document.getElementById("pw-toggle").innerHTML = lucideI(show ? "eye-off" : "eye");
    refreshIcons();
  };
  document.getElementById("forgot-pw").onclick = () => toast("Liên hệ quản trị viên để đặt lại mật khẩu.");
  document.getElementById("go-signup").onclick = () => toast("Đăng ký tài khoản do quản trị viên cấp. Dùng tài khoản demo để đăng nhập.");
  document.getElementById("login-form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const user = loginMock(String(fd.get("email") || "").trim(), String(fd.get("password") || ""));
    const box = document.getElementById("login-err");
    if (!user) {
      box.innerHTML = `<div class="alert-error">Email hoặc mật khẩu không đúng.</div>`;
      return;
    }
    saveSession(user, Boolean(fd.get("remember")));
    toast("Đăng nhập thành công");
    location.hash = "#/dashboard";
    route();
  };
  refreshIcons();
};

refreshIcons();
if (currentUser()) renderApp();
else renderLogin();

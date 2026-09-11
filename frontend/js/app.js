let page = "dashboard";
let editId = null;
let ccy = "USD";
let reportTab = "overview";
let reportFrom = "2026-09-01";
let reportTo = "2026-09-30";
let reportSrc = "";
let reportKind = "ALL";
let reportCat = "";
const charts = {};
let confirmCb = null;

const ICONS = {
  dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>',
  incomes: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M12 5l-5 5M12 5l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  expenses: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M12 19l-5-5M12 19l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  reports: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M12 12l5-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  import: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" stroke-width="1.8"/><path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  audit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 7h8M8 12h8M8 17h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="9" r="2.2" stroke="currentColor" stroke-width="1.8"/><path d="M20.5 19c0-2-1.6-3.6-3.5-3.6" stroke="currentColor" stroke-width="1.8"/></svg>',
  profile: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 19c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10 7V5a2 2 0 012-2h7v18h-7a2 2 0 01-2-2v-2M15 12H3m0 0l3-3M3 12l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

const ICON_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13.5 6.5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_DEL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 11v6M14 11v6M8 7V5a1 1 0 011-1h6a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const NAV = [
  { page: "dashboard", label: "Tổng quan", perm: "dashboard" },
  { page: "incomes", label: "Khoản thu", perm: "incomeRead" },
  { page: "expenses", label: "Khoản chi", perm: "expenseRead" },
  { page: "reports", label: "Báo cáo", perm: "reportRead" },
  { page: "import", label: "Nhập Excel", perm: "importData" },
  { page: "audit", label: "Nhật ký hoạt động", perm: "auditRead" },
];

const TITLES = {
  dashboard: "Tổng quan tài chính",
  incomes: "Khoản thu",
  "income-form": "Thêm khoản thu",
  "income-edit": "Sửa khoản thu",
  expenses: "Khoản chi",
  "expense-form": "Thêm khoản chi",
  "expense-edit": "Sửa khoản chi",
  reports: "Báo cáo",
  import: "Import dữ liệu",
  audit: "Nhật ký hoạt động",
  users: "Người dùng",
  profile: "Hồ sơ cá nhân",
  forbidden: "Không có quyền truy cập",
};

function money(n, currency = ccy) {
  if (currency === "VND") return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
const dmy = (iso) => (iso || "").split("-").reverse().join("/");
const srcLabel = (s) => (s === "EXCEL_IMPORT" ? "Excel" : "Nhập tay");
const srcBadge = (s) =>
  s === "EXCEL_IMPORT" ? `<span class="badge mint">Excel</span>` : `<span class="badge">Nhập tay</span>`;
const catName = (list, id) => list.find((c) => c.id === id)?.name || "—";
const userName = (id) => USERS.find((u) => u.id === id)?.name || "—";
const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(-2)
    .toUpperCase();

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function openConfirm(text, onOk) {
  confirmCb = onOk;
  document.getElementById("modal-text").textContent = text;
  document.getElementById("modal-back").classList.add("open");
}

function closeModal() {
  confirmCb = null;
  document.getElementById("modal-back").classList.remove("open");
}

function destroyCharts() {
  Object.keys(charts).forEach((k) => {
    charts[k]?.destroy();
    delete charts[k];
  });
}

function parseHash() {
  const raw = (location.hash || "#/dashboard").replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  const p = parts[0] || "dashboard";
  if (p === "login") return { page: "login", id: null };
  if (p === "403" || p === "forbidden") return { page: "forbidden", id: null };
  if (p === "incomes" && parts[1] === "new") return { page: "income-form", id: null };
  if (p === "incomes" && parts[1] === "edit") return { page: "income-edit", id: Number(parts[2]) };
  if (p === "expenses" && parts[1] === "new") return { page: "expense-form", id: null };
  if (p === "expenses" && parts[1] === "edit") return { page: "expense-edit", id: Number(parts[2]) };
  return { page: p, id: null };
}

function go(p, id) {
  const map = {
    dashboard: "#/dashboard",
    incomes: "#/incomes",
    "income-form": "#/incomes/new",
    expenses: "#/expenses",
    "expense-form": "#/expenses/new",
    reports: "#/reports",
    import: "#/import",
    audit: "#/audit",
    users: "#/users",
    profile: "#/profile",
    forbidden: "#/403",
    login: "#/login",
  };
  if (p === "income-edit") location.hash = `#/incomes/edit/${id}`;
  else if (p === "expense-edit") location.hash = `#/expenses/edit/${id}`;
  else location.hash = map[p] || "#/dashboard";
}

function requiredPerm(p) {
  if (p === "income-form") return "incomeCreate";
  if (p === "income-edit") return "incomeUpdate";
  if (p === "expense-form") return "expenseCreate";
  if (p === "expense-edit") return "expenseUpdate";
  return PAGE_PERM[p] || null;
}

function route() {
  const u = currentUser();
  const parsed = parseHash();
  if (!u) {
    if (parsed.page !== "login") {
      location.hash = "#/login";
      return renderLogin();
    }
    return renderLogin();
  }
  if (parsed.page === "login") {
    location.hash = "#/dashboard";
    return;
  }
  const perm = requiredPerm(parsed.page);
  if (parsed.page !== "forbidden" && perm && !can(perm)) {
    page = "forbidden";
    if (location.hash !== "#/403") location.hash = "#/403";
    renderApp();
    return;
  }
  if (parsed.page === "income-edit") {
    const rec = INCOMES.find((x) => x.id === parsed.id);
    if (!rec || !canEditOwn(rec, "incomeUpdate")) {
      page = "forbidden";
      location.hash = "#/403";
      renderApp();
      return;
    }
  }
  if (parsed.page === "expense-edit") {
    const rec = EXPENSES.find((x) => x.id === parsed.id);
    if (!rec || !canEditOwn(rec, "expenseUpdate")) {
      page = "forbidden";
      location.hash = "#/403";
      renderApp();
      return;
    }
  }
  page = parsed.page;
  editId = parsed.id;
  renderApp();
}

function setShell(loggedIn) {
  document.body.classList.toggle("login-mode", !loggedIn);
  document.body.classList.toggle("app", loggedIn);
  const loginRoot = document.getElementById("login-root");
  loginRoot.classList.toggle("hidden", loggedIn);
  if (loggedIn) loginRoot.innerHTML = "";
  document.getElementById("sidebar").classList.toggle("hidden", !loggedIn);
  document.getElementById("workspace").classList.toggle("hidden", !loggedIn);
}

function renderLogin() {
  setShell(false);
  destroyCharts();
  document.getElementById("login-root").innerHTML = `
    <div class="login-wrap">
      <form class="login-card" id="login-form">
        <div class="brand" style="padding:0">
          <span class="brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M7 7l10 10M9 5l2 2M5 9l2 2M15 17l2 2M17 15l2 2" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </span>
          <strong>Handmade Finance</strong>
        </div>
        <h1>Đăng nhập</h1>
        <p class="lead">Quản lý thu – chi shop handmade</p>
        <div id="login-err"></div>
        <div class="login-fields">
          <label class="field"><span>Email</span><input name="email" type="email" autocomplete="username" required /></label>
          <label class="field"><span>Mật khẩu</span>
            <div class="pw-wrap">
              <input name="password" id="pw" type="password" autocomplete="current-password" required />
              <button type="button" class="pw-toggle" id="pw-toggle">Hiện</button>
            </div>
          </label>
          <label class="check"><input type="checkbox" name="remember" /> Remember me</label>
        </div>
        <button class="btn primary" type="submit">Đăng nhập</button>
        <div class="demo-box">
          Demo (mật khẩu <code>123456</code>):<br />
          admin@demo.local · owner@demo.local · staff@demo.local · viewer@demo.local
        </div>
      </form>
    </div>`;
  document.getElementById("pw-toggle").onclick = () => {
    const inp = document.getElementById("pw");
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    document.getElementById("pw-toggle").textContent = show ? "Ẩn" : "Hiện";
  };
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
}

function buildNav() {
  const items = NAV.filter((n) => can(n.perm))
    .map(
      (n) =>
        `<button class="nav-btn ${navKey(page) === n.page ? "active" : ""}" data-go="${n.page}">${ICONS[n.page]} ${n.label}</button>`
    )
    .join("");
  document.getElementById("main-nav").innerHTML = items;
  const u = currentUser();
  const av = u.avatar
    ? `<img alt="" src="${u.avatar}" />`
    : initials(u.name);
  let foot = "";
  if (can("userManagement")) {
    foot += `<button class="nav-btn ${page === "users" ? "active" : ""}" data-go="users">${ICONS.users} Người dùng</button>`;
  }
  foot += `<button class="nav-btn ${page === "profile" ? "active" : ""}" data-go="profile">${ICONS.profile} Hồ sơ cá nhân</button>`;
  foot += `<button class="nav-btn" id="logout-nav">${ICONS.logout} Đăng xuất</button>`;
  foot += `<div class="user-chip"><span class="avatar">${av}</span><div><strong>${u.name}</strong><small>${ROLE_LABEL[u.role]}</small></div></div>`;
  document.getElementById("side-foot").innerHTML = foot;
}

function navKey(p) {
  if (p.startsWith("income")) return "incomes";
  if (p.startsWith("expense")) return "expenses";
  return p;
}

function fillTopbar() {
  const u = currentUser();
  document.getElementById("topbar-title").textContent = TITLES[page] || "Finance Manager";
  document.getElementById("top-name").textContent = u.name;
  document.getElementById("top-role").textContent = ROLE_LABEL[u.role];
  const av = document.getElementById("top-avatar");
  if (u.avatar) av.innerHTML = `<img alt="" src="${u.avatar}" />`;
  else av.textContent = initials(u.name);
}

function logout() {
  clearSession();
  toast("Đã đăng xuất");
  location.hash = "#/login";
  route();
}

function renderApp() {
  setShell(true);
  fillTopbar();
  buildNav();
  destroyCharts();
  const view = document.getElementById("view");
  const map = {
    dashboard,
    incomes: incomeList,
    "income-form": () => incomeForm(null),
    "income-edit": () => incomeForm(INCOMES.find((x) => x.id === editId)),
    expenses: expenseList,
    "expense-form": () => expenseForm(null),
    "expense-edit": () => expenseForm(EXPENSES.find((x) => x.id === editId)),
    reports,
    import: importPage,
    audit: auditPage,
    users: usersPage,
    profile: profilePage,
    forbidden: forbiddenPage,
  };
  view.innerHTML = (map[page] || dashboard)();
  bindApp();
  if (page === "dashboard") drawDash();
  if (page === "reports") drawReports();
}

function filteredIncomes() {
  return INCOMES.filter((x) => x.currency === ccy);
}
function filteredExpenses() {
  return EXPENSES.filter((x) => x.currency === ccy);
}

function sum(list) {
  return list.reduce((a, x) => a + Number(x.amount), 0);
}

function monthlySeries() {
  return MONTHLY[ccy] || MONTHLY.USD;
}

function groupByCat(list, cats) {
  const map = {};
  list.forEach((e) => {
    const n = catName(cats, e.categoryId);
    map[n] = (map[n] || 0) + e.amount;
  });
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(map).map(([name, amount]) => ({ name, amount, pct: Math.round((amount / total) * 100) }));
}
function expenseByCat(list = filteredExpenses()) {
  return groupByCat(list, EXPENSE_CATEGORIES);
}
function incomeByCat(list = filteredIncomes()) {
  return groupByCat(list, INCOME_CATEGORIES);
}

function ccySelect() {
  return `<div class="actions" style="display:flex;gap:10px;flex-wrap:wrap">
    <label class="pill">Tiền tệ:
      <select id="ccySel"><option value="USD">USD ($)</option><option value="VND">VND (₫)</option></select>
    </label>
    <span class="pill">Tháng này</span>
  </div>`;
}

function dashboard() {
  const inc = filteredIncomes();
  const exp = filteredExpenses();
  const tin = sum(inc);
  const tex = sum(exp);
  const net = tin - tex;
  const tx = inc.length + exp.length;
  const byCat = expenseByCat();
  return `
    <div class="page-head">
      <div><h1 class="page-title">Tổng quan tài chính</h1><p class="page-sub">Theo dõi tình hình kinh doanh, doanh thu và chi phí thực tế của shop.</p></div>
      ${ccySelect()}
    </div>
    <div class="kpis">
      <article class="card kpi"><div class="label">Tổng thu nhập</div><div class="row"><div class="value">${money(tin)}</div><span class="chg up">+12%</span></div></article>
      <article class="card kpi"><div class="label">Tổng chi phí</div><div class="row"><div class="value">${money(tex)}</div><span class="chg down">-4%</span></div></article>
      <article class="card kpi"><div class="label">Chênh lệch Thu - Chi</div><div class="row"><div class="value">${money(net)}</div><span class="chg up">+24%</span></div></article>
      <article class="card kpi"><div class="label">Số giao dịch</div><div class="row"><div class="value">${tx}</div><span class="chg up">+8%</span></div></article>
    </div>
    <div class="grid-2">
      <article class="card">
        <div class="card-head"><h3 class="section-title">Biểu đồ Thu nhập vs Chi phí (Tháng 1–6)</h3>
          <div class="legend"><span><i class="dot" style="background:#14b8a6"></i>Khoản thu</span><span><i class="dot" style="background:#fb7185"></i>Khoản chi</span></div>
        </div>
        <div class="chart-wrap"><canvas id="barChart"></canvas></div>
      </article>
      <article class="card">
        <h3 class="section-title">Tỷ lệ chi theo loại</h3>
        ${byCat.length ? `<div class="chart-sm" style="margin-top:12px"><canvas id="pieChart"></canvas></div>
          <div class="donut-legend" style="margin-top:12px">${byCat.map((x) => `<div class="row-item"><span>${x.name}</span><b class="num">${x.pct}%</b></div>`).join("")}</div>` : `<div class="empty">Chưa có khoản chi.</div>`}
      </article>
    </div>
    <div class="grid-lists">
      <article class="card">
        <div class="card-head"><h3 class="section-title">Khoản thu gần đây</h3><button class="link" data-go="incomes">Xem tất cả</button></div>
        ${inc.slice().reverse().slice(0, 3).map((r) => `<div class="row-item"><div><b>${r.description}</b><div class="muted">${catName(INCOME_CATEGORIES, r.categoryId)}</div></div><div class="plus">+${money(r.amount)}</div></div>`).join("") || `<div class="empty">Chưa có khoản thu nào.</div>`}
      </article>
      <article class="card">
        <div class="card-head"><h3 class="section-title">Khoản chi gần đây</h3><button class="link" data-go="expenses">Xem tất cả</button></div>
        ${exp.slice().reverse().slice(0, 3).map((r) => `<div class="row-item"><div><b>${r.description}</b><div class="muted">${catName(EXPENSE_CATEGORIES, r.categoryId)}</div></div><div class="minus">−${money(r.amount)}</div></div>`).join("") || `<div class="empty">Chưa có khoản chi nào.</div>`}
      </article>
    </div>`;
}

function listFilters(kind) {
  const cats = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const catLabel = kind === "income" ? "Loại thu" : "Loại chi";
  const ph = kind === "income" ? "Tìm nội dung, mã tham chiếu..." : "Tìm nội dung, người nhận...";
  return `
    <div class="toolbar">
      <input id="q" class="toolbar-search" type="search" placeholder="${ph}" />
      <select id="fCat" class="toolbar-ctrl"><option value="">${catLabel}: Tất cả</option>${cats.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select>
      <select id="fSrc" class="toolbar-ctrl"><option value="">Nguồn: Tất cả</option><option value="MANUAL">Nhập tay</option><option value="EXCEL_IMPORT">Excel</option></select>
      <select id="fCcy" class="toolbar-ctrl"><option value="USD">USD ($)</option><option value="VND">VND (₫)</option></select>
      <input id="fFrom" class="toolbar-ctrl" type="date" title="Từ ngày" />
      <input id="fTo" class="toolbar-ctrl" type="date" title="Đến ngày" />
      <button class="btn ghost" type="button" id="clearF">Xóa bộ lọc</button>
    </div>`;
}

function incomeList() {
  const rows = filteredIncomes();
  const showAct = can("incomeUpdate") || can("incomeDelete");
  return `
    <div class="page-head">
      <div><h1 class="page-title">Danh sách khoản thu</h1><p class="page-sub">Tổng số: <b>${rows.length}</b> khoản (${ccy})</p></div>
      <div style="display:flex;gap:10px">${can("importData") ? `<button class="btn ghost" data-go="import">Nhập Excel</button>` : ""}${can("incomeCreate") ? `<button class="btn primary" data-go="income-form">+ Thêm khoản thu</button>` : ""}</div>
    </div>
    ${listFilters("income")}
    <article class="card" style="padding:0">
      <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Ngày</th><th>Nội dung</th><th>Loại thu</th><th class="amount">Số tiền</th><th>Tiền tệ</th><th>Nguồn</th><th>Người tạo</th>
          ${showAct ? "<th>Thao tác</th>" : ""}
        </tr></thead>
        <tbody id="rows">${incomeRows(rows, showAct)}</tbody>
      </table>
      </div>
      ${rows.length ? "" : `<div class="empty"><strong>Chưa có khoản thu nào.</strong>Thử đổi bộ lọc hoặc thêm khoản mới.</div>`}
    </article>`;
}

function incomeRows(rows, showAct) {
  if (!rows.length) return "";
  return rows
    .map((r) => {
      const edit = canEditOwn(r, "incomeUpdate");
      const del = canDeleteOwn(r, "incomeDelete");
      const acts = showAct
        ? `<td><div class="row-actions">${edit ? `<button class="icon-btn" data-edit-in="${r.id}" title="Sửa">${ICON_EDIT}</button>` : ""}${del ? `<button class="icon-btn danger" data-del-in="${r.id}" title="Xóa">${ICON_DEL}</button>` : ""}</div></td>`
        : "";
      return `<tr data-cat="${r.categoryId}" data-src="${r.source}" data-date="${r.incomeDate}" data-text="${(r.description + (r.referenceCode || "")).toLowerCase()}">
        <td>${dmy(r.incomeDate)}</td><td><b>${r.description}</b></td>
        <td><span class="badge mint">${catName(INCOME_CATEGORIES, r.categoryId)}</span></td>
        <td class="amount plus">${money(r.amount, r.currency)}</td><td>${r.currency}</td>
        <td>${srcBadge(r.source)}</td><td>${userName(r.createdBy)}</td>${acts}</tr>`;
    })
    .join("");
}

function expenseList() {
  const rows = filteredExpenses();
  const showAct = can("expenseUpdate") || can("expenseDelete");
  return `
    <div class="page-head">
      <div><h1 class="page-title">Danh sách khoản chi</h1><p class="page-sub">Tổng số: <b>${rows.length}</b> khoản (${ccy})</p></div>
      <div style="display:flex;gap:10px">${can("importData") ? `<button class="btn ghost" data-go="import">Nhập Excel</button>` : ""}${can("expenseCreate") ? `<button class="btn primary" data-go="expense-form">+ Thêm khoản chi</button>` : ""}</div>
    </div>
    ${listFilters("expense")}
    <article class="card" style="padding:0">
      <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Ngày</th><th>Nội dung</th><th>Loại chi</th><th>Người nhận</th><th class="amount">Số tiền</th><th>Tiền tệ</th><th>Nguồn</th><th>Người tạo</th>
          ${showAct ? "<th>Thao tác</th>" : ""}
        </tr></thead>
        <tbody id="rows">${expenseRows(rows, showAct)}</tbody>
      </table>
      </div>
      ${rows.length ? "" : `<div class="empty"><strong>Chưa có khoản chi nào.</strong></div>`}
    </article>`;
}

function expenseRows(rows, showAct) {
  if (!rows.length) return "";
  return rows
    .map((r) => {
      const edit = canEditOwn(r, "expenseUpdate");
      const del = canDeleteOwn(r, "expenseDelete");
      const acts = showAct
        ? `<td><div class="row-actions">${edit ? `<button class="icon-btn" data-edit-ex="${r.id}" title="Sửa">${ICON_EDIT}</button>` : ""}${del ? `<button class="icon-btn danger" data-del-ex="${r.id}" title="Xóa">${ICON_DEL}</button>` : ""}</div></td>`
        : "";
      return `<tr data-cat="${r.categoryId}" data-src="${r.source}" data-date="${r.expenseDate}" data-text="${(r.description + (r.recipient || "")).toLowerCase()}">
        <td>${dmy(r.expenseDate)}</td><td><b>${r.description}</b></td>
        <td><span class="badge pink">${catName(EXPENSE_CATEGORIES, r.categoryId)}</span></td>
        <td>${r.recipient || "—"}</td>
        <td class="amount minus">${money(r.amount, r.currency)}</td><td>${r.currency}</td>
        <td>${srcBadge(r.source)}</td><td>${userName(r.createdBy)}</td>${acts}</tr>`;
    })
    .join("");
}

function incomeForm(rec) {
  const r = rec || { incomeDate: "2026-09-11", description: "", categoryId: 1, amount: "", currency: "USD", referenceCode: "", source: "MANUAL", note: "" };
  return `
    <div class="page-head">
      <div><h1 class="page-title">${rec ? "Sửa khoản thu" : "Thêm khoản thu"}</h1></div>
      <button class="btn secondary" data-go="incomes">Quay lại</button>
    </div>
    <form class="card" id="rec-form">
      <div class="form-grid">
        <label class="field"><span>Ngày thu <span class="req">*</span></span><input name="incomeDate" type="date" required value="${r.incomeDate}" /></label>
        <label class="field"><span>Loại thu <span class="req">*</span></span>
          <select name="categoryId">${INCOME_CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === r.categoryId ? "selected" : ""}>${c.name}</option>`).join("")}</select>
        </label>
        <label class="field"><span>Số tiền <span class="req">*</span></span><input name="amount" type="number" step="0.01" required value="${r.amount}" /></label>
        <label class="field"><span>Tiền tệ <span class="req">*</span></span>
          <select name="currency"><option ${r.currency === "USD" ? "selected" : ""}>USD</option><option ${r.currency === "VND" ? "selected" : ""}>VND</option></select>
        </label>
        <label class="field span-2"><span>Nội dung <span class="req">*</span></span><input name="description" required value="${r.description || ""}" /></label>
        <label class="field span-2"><span>Mã tham chiếu</span><input name="referenceCode" value="${r.referenceCode || ""}" /></label>
        <label class="field span-2"><span>Ghi chú</span><textarea name="note">${r.note || ""}</textarea></label>
        <label class="field span-2"><span>Chứng từ</span><div class="upload">Chọn file chứng từ (mock, không tải lên máy chủ)</div></label>
      </div>
      <div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">
        <button type="button" class="btn secondary" data-go="incomes">Hủy</button>
        <button class="btn primary" type="submit">${rec ? "Cập nhật" : "Lưu khoản thu"}</button>
      </div>
    </form>`;
}

function expenseForm(rec) {
  const r = rec || { expenseDate: "2026-09-11", description: "", categoryId: 1, amount: "", currency: "USD", recipient: "", source: "MANUAL", note: "" };
  return `
    <div class="page-head">
      <div><h1 class="page-title">${rec ? "Sửa khoản chi" : "Thêm khoản chi"}</h1></div>
      <button class="btn secondary" data-go="expenses">Quay lại</button>
    </div>
    <form class="card" id="rec-form">
      <div class="form-grid">
        <label class="field"><span>Ngày chi <span class="req">*</span></span><input name="expenseDate" type="date" required value="${r.expenseDate}" /></label>
        <label class="field"><span>Loại chi <span class="req">*</span></span>
          <select name="categoryId">${EXPENSE_CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === r.categoryId ? "selected" : ""}>${c.name}</option>`).join("")}</select>
        </label>
        <label class="field"><span>Số tiền <span class="req">*</span></span><input name="amount" type="number" step="0.01" required value="${r.amount}" /></label>
        <label class="field"><span>Tiền tệ <span class="req">*</span></span>
          <select name="currency"><option ${r.currency === "USD" ? "selected" : ""}>USD</option><option ${r.currency === "VND" ? "selected" : ""}>VND</option></select>
        </label>
        <label class="field span-2"><span>Nội dung <span class="req">*</span></span><input name="description" required value="${r.description || ""}" /></label>
        <label class="field span-2"><span>Người nhận</span><input name="recipient" value="${r.recipient || ""}" /></label>
        <label class="field span-2"><span>Ghi chú</span><textarea name="note">${r.note || ""}</textarea></label>
        <label class="field span-2"><span>Chứng từ</span><div class="upload">Chọn file chứng từ (mock)</div></label>
      </div>
      <div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">
        <button type="button" class="btn secondary" data-go="expenses">Hủy</button>
        <button class="btn primary" type="submit">${rec ? "Cập nhật" : "Lưu khoản chi"}</button>
      </div>
    </form>`;
}

function inRange(date, from, to) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function reports() {
  let inc = filteredIncomes().filter((x) => inRange(x.incomeDate, reportFrom, reportTo));
  let exp = filteredExpenses().filter((x) => inRange(x.expenseDate, reportFrom, reportTo));
  if (reportSrc) {
    inc = inc.filter((x) => x.source === reportSrc);
    exp = exp.filter((x) => x.source === reportSrc);
  }
  if (reportCat) {
    inc = inc.filter((x) => String(x.categoryId) === String(reportCat));
    exp = exp.filter((x) => String(x.categoryId) === String(reportCat));
  }
  if (reportKind === "INCOME") exp = [];
  if (reportKind === "EXPENSE") inc = [];
  const tin = sum(inc);
  const tex = sum(exp);
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
  const tabs = [
    ["overview", "Tổng quan"],
    ["daily", "Theo ngày"],
    ["in", "Theo loại thu"],
    ["out", "Theo loại chi"],
  ];
  const catOpts =
    reportKind === "EXPENSE"
      ? EXPENSE_CATEGORIES
      : reportKind === "INCOME"
        ? INCOME_CATEGORIES
        : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  let body = "";
  if (reportTab === "overview") {
    body = `
      <div class="kpis">
        <article class="card kpi"><div class="label">Tổng thu (${ccy})</div><div class="row"><div class="value">${money(tin)}</div></div></article>
        <article class="card kpi"><div class="label">Tổng chi (${ccy})</div><div class="row"><div class="value">${money(tex)}</div></div></article>
        <article class="card kpi"><div class="label">Chênh lệch</div><div class="row"><div class="value">${money(tin - tex)}</div></div></article>
        <article class="card kpi"><div class="label">Số giao dịch</div><div class="row"><div class="value">${inc.length + exp.length}</div></div></article>
      </div>
      <article class="card"><div class="card-head"><h3 class="section-title">Thu – chi theo tháng</h3></div><div class="chart-wrap"><canvas id="rBar"></canvas></div></article>`;
  } else if (reportTab === "daily") {
    body = `<article class="card" style="padding:0"><div class="table-wrap"><table>
      <thead><tr><th>Ngày</th><th class="amount">Thu</th><th class="amount">Chi</th><th class="amount">Chênh lệch</th></tr></thead>
      <tbody>${
        daily.length
          ? daily.map((x) => `<tr><td>${dmy(x.d)}</td><td class="amount plus">${money(x.income)}</td><td class="amount minus">${money(x.expense)}</td><td class="amount">${money(x.income - x.expense)}</td></tr>`).join("")
          : `<tr><td colspan="4"><div class="empty">Không có dữ liệu trong khoảng ngày.</div></td></tr>`
      }</tbody></table></div></article>`;
  } else if (reportTab === "in") {
    const cats = incomeByCat(inc);
    body = `<div class="grid-2"><article class="card"><h3 class="section-title">Biểu đồ loại thu</h3><div class="chart-sm"><canvas id="rIn"></canvas></div></article>
      <article class="card"><h3 class="section-title">Chi tiết</h3>${cats.map((x) => `<div class="row-item"><span>${x.name}</span><b class="num">${money(x.amount)}</b></div>`).join("") || `<div class="empty">Chưa có khoản thu.</div>`}</article></div>`;
  } else {
    const cats = expenseByCat(exp);
    body = `<div class="grid-2"><article class="card"><h3 class="section-title">Biểu đồ loại chi</h3><div class="chart-sm"><canvas id="rOut"></canvas></div></article>
      <article class="card"><h3 class="section-title">Chi tiết</h3>${cats.map((x) => `<div class="row-item"><span>${x.name}</span><b class="num">${money(x.amount)}</b></div>`).join("") || `<div class="empty">Chưa có khoản chi.</div>`}</article></div>`;
  }
  return `
    <div class="page-head">
      <div><h1 class="page-title">Báo cáo</h1><p class="page-sub">Số liệu theo một loại tiền tệ. Có thể xuất hóa đơn tổng hợp (mock in).</p></div>
      <button class="btn primary" type="button" id="export-invoice">Xuất hóa đơn</button>
    </div>
    <div class="toolbar">
      <select id="ccySel" class="toolbar-ctrl"><option value="USD">USD ($)</option><option value="VND">VND (₫)</option></select>
      <select id="rKind" class="toolbar-ctrl">
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
        ${catOpts.map((c) => `<option value="${c.id}" ${String(reportCat) === String(c.id) ? "selected" : ""}>${c.name}</option>`).join("")}
      </select>
      <input id="rFrom" class="toolbar-ctrl" type="date" value="${reportFrom}" title="Từ ngày" />
      <input id="rTo" class="toolbar-ctrl" type="date" value="${reportTo}" title="Đến ngày" />
    </div>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${reportTab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>
    ${body}`;
}

function importPage() {
  return `
    <div class="page-head">
      <div><h1 class="page-title">Nhập Excel</h1><p class="page-sub">Theo dõi từng lần import. Prototype không đọc file thật.</p></div>
    </div>
    <div class="steps">
      <div class="step"><b>1</b>Chọn loại thu/chi</div>
      <div class="step"><b>2</b>Tải tệp tin lên</div>
      <div class="step"><b>3</b>Xem trước dữ liệu</div>
      <div class="step"><b>4</b>Hoàn tất import</div>
    </div>
    <div class="grid-2">
      <article class="card">
        <h3 class="section-title">Tải file lên</h3>
        <div class="radio-row" style="margin:16px 0">
          <label class="choice"><input type="radio" name="itype" value="INCOME" checked /> Khoản thu</label>
          <label class="choice"><input type="radio" name="itype" value="EXPENSE" /> Khoản chi</label>
        </div>
        <label class="dropzone">
          <input type="file" id="xlsx" accept=".xlsx,.xls,.csv" />
          <b>Chọn hoặc kéo thả file Excel</b>
          <small>.xlsx / .csv · tối đa 10MB · chỉ mô phỏng</small>
          <span class="muted" id="file-name">Chưa chọn tệp</span>
        </label>
        <p class="muted" style="margin-top:12px">File mẫu để test:
          <a class="link" href="samples/mau-khoan-thu.xlsx" download>mau-khoan-thu.xlsx</a>
          ·
          <a class="link" href="samples/mau-khoan-chi.xlsx" download>mau-khoan-chi.xlsx</a>
        </p>
        <button class="btn primary" id="do-import" style="margin-top:16px">Bắt đầu Import</button>
        <div id="import-status" style="margin-top:12px"></div>
      </article>
      <article class="card">
        <h3 class="section-title">Lịch sử nhập gần đây</h3>
        ${IMPORTS.map(
          (b) => `<div class="row-item"><div><b>${b.fileName}</b><div class="muted">${b.type === "INCOME" ? "Khoản thu" : "Khoản chi"} · ${b.createdAt}</div></div>
          <span class="badge ${b.status === "COMPLETED" ? "ok" : "fail"}">${b.status === "COMPLETED" ? "Hoàn thành" : "Thất bại"}</span></div>`
        ).join("")}
      </article>
    </div>
    <article class="card" id="preview-card" style="display:none">
      <div class="card-head"><h3 class="section-title">Xem trước dữ liệu</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>STT</th><th>Ngày</th><th>Nội dung</th><th class="amount">Số tiền</th><th>Trạng thái</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>11/09/2026</td><td>Dòng mẫu 1</td><td class="amount plus">85.00</td><td><span class="badge ok">Hợp lệ</span></td></tr>
          <tr><td>2</td><td>10/09/2026</td><td>Dòng mẫu 2</td><td class="amount plus">120.00</td><td><span class="badge ok">Hợp lệ</span></td></tr>
        </tbody>
      </table></div>
    </article>`;
}

function auditPage() {
  const actions = [...new Set(AUDIT_LOGS.map((a) => a.action))];
  return `
    <div class="page-head">
      <div><h1 class="page-title">Nhật ký hoạt động</h1><p class="page-sub">${AUDIT_LOGS.length} sự kiện gần đây</p></div>
    </div>
    <div class="toolbar">
      <input id="q" class="toolbar-search" type="search" placeholder="Tìm hành động, nội dung..." />
      <select id="fUser" class="toolbar-ctrl"><option value="">Người dùng: Tất cả</option>${USERS.map((u) => `<option value="${u.id}">${u.name}</option>`).join("")}</select>
      <select id="fAct" class="toolbar-ctrl"><option value="">Hành động: Tất cả</option>${actions.map((a) => `<option>${a}</option>`).join("")}</select>
      <button class="btn ghost" type="button" id="clearF">Xóa bộ lọc</button>
    </div>
    <article class="card" style="padding:0"><div class="table-wrap"><table>
      <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Hành động</th><th>Đối tượng</th><th>Nội dung</th></tr></thead>
      <tbody id="rows">${AUDIT_LOGS.map((a) => `<tr data-user="${a.userId}" data-act="${a.action}" data-text="${(a.action + a.detail + userName(a.userId)).toLowerCase()}">
        <td>${a.time}</td><td>${userName(a.userId)}</td><td><span class="badge mint">${a.action}</span></td><td>${a.target}</td><td>${a.detail}</td></tr>`).join("")}</tbody>
    </table></div></article>`;
}

function usersPage() {
  return `
    <div class="page-head">
      <div><h1 class="page-title">Người dùng</h1><p class="page-sub">${USERS.length} tài khoản mock</p></div>
      <button class="btn primary" type="button" id="open-user-modal">+ Thêm user</button>
    </div>
    <article class="card" style="padding:0"><div class="table-wrap"><table>
      <thead><tr><th>Tên</th><th>Email</th><th>Role</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
      <tbody>${USERS.map(
        (u) => `<tr>
          <td>${u.name}</td><td>${u.email}</td>
          <td><select class="toolbar-ctrl" data-role="${u.id}">${Object.keys(ROLE_LABEL).map((k) => `<option value="${k}" ${u.role === k ? "selected" : ""}>${ROLE_LABEL[k]}</option>`).join("")}</select></td>
          <td><span class="badge ${u.status === "active" ? "ok" : "fail"}">${u.status === "active" ? "Hoạt động" : "Tắt"}</span></td>
          <td>
            <button class="btn secondary" data-toggle="${u.id}" style="height:32px;padding:0 10px">${u.status === "active" ? "Tắt" : "Bật"}</button>
            <button class="btn ghost" data-rename="${u.id}" style="height:32px">Sửa tên</button>
          </td>
        </tr>`
      ).join("")}</tbody>
    </table></div></article>`;
}

function profilePage() {
  const u = currentUser();
  return `
    <div class="page-head"><div><h1 class="page-title">Hồ sơ cá nhân</h1></div></div>
    <article class="card" style="max-width:520px">
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px">
        <span class="avatar" style="width:56px;height:56px;font-size:18px">${u.avatar ? `<img src="${u.avatar}" alt="" />` : initials(u.name)}</span>
        <div><strong>${u.name}</strong><div class="muted">${u.email}</div><div class="muted">${ROLE_LABEL[u.role]}</div></div>
      </div>
      <form id="profile-form" class="login-fields">
        <label class="field"><span>Tên</span><input name="name" value="${u.name}" required /></label>
        <label class="field"><span>Avatar (URL ảnh, tuỳ chọn)</span><input name="avatar" value="${u.avatar || ""}" placeholder="https://..." /></label>
        <label class="field"><span>Email</span><input value="${u.email}" disabled /></label>
        <button class="btn primary" type="submit">Lưu hồ sơ</button>
      </form>
    </article>`;
}

function forbiddenPage() {
  return `<div class="forbidden">
    <h2>Bạn không có quyền truy cập</h2>
    <p class="muted" style="margin-bottom:20px">Tài khoản hiện tại không được mở trang này.</p>
    <button class="btn primary" data-go="dashboard">Quay lại Dashboard</button>
  </div>`;
}

function drawDash() {
  const monthly = monthlySeries();
  const canvas = document.getElementById("barChart");
  if (!canvas) return;
  charts.bar = new Chart(canvas, {
    type: "bar",
    data: {
      labels: monthly.map((x) => x.m),
      datasets: [
        { label: "Thu", data: monthly.map((x) => x.income), backgroundColor: "#14b8a6", borderRadius: 4, barPercentage: 0.7 },
        { label: "Chi", data: monthly.map((x) => x.expense), backgroundColor: "#fb7185", borderRadius: 4, barPercentage: 0.7 },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: "#f3f4f6" } }, x: { grid: { display: false } } },
      maintainAspectRatio: false,
    },
  });
  const pie = document.getElementById("pieChart");
  const cats = expenseByCat();
  if (pie && cats.length) {
    charts.pie = new Chart(pie, {
      type: "doughnut",
      data: { labels: cats.map((x) => x.name), datasets: [{ data: cats.map((x) => x.amount), backgroundColor: ["#14b8a6", "#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa"], borderWidth: 0 }] },
      options: { plugins: { legend: { display: false } }, cutout: "68%", maintainAspectRatio: false },
    });
  }
}

function drawReports() {
  if (reportTab === "overview") {
    const monthly = monthlySeries();
    const el = document.getElementById("rBar");
    if (!el) return;
    charts.rBar = new Chart(el, {
      type: "bar",
      data: {
        labels: monthly.map((x) => x.m),
        datasets: [
          { data: monthly.map((x) => x.income), backgroundColor: "#14b8a6", borderRadius: 4 },
          { data: monthly.map((x) => x.expense), backgroundColor: "#fb7185", borderRadius: 4 },
        ],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } }, maintainAspectRatio: false },
    });
  }
  const doughnut = (id, labels, data) => {
    const el = document.getElementById(id);
    if (!el || !data.length) return;
    charts[id] = new Chart(el, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: ["#14b8a6", "#38bdf8", "#f87171", "#fbbf24", "#34d399"], borderWidth: 0 }] },
      options: { plugins: { legend: { display: false } }, cutout: "70%", maintainAspectRatio: false },
    });
  };
  if (reportTab === "in") doughnut("rIn", incomeByCat(filteredIncomes().filter((x) => inRange(x.incomeDate, reportFrom, reportTo))).map((x) => x.name), incomeByCat(filteredIncomes().filter((x) => inRange(x.incomeDate, reportFrom, reportTo))).map((x) => x.amount));
  if (reportTab === "out") doughnut("rOut", expenseByCat(filteredExpenses().filter((x) => inRange(x.expenseDate, reportFrom, reportTo))).map((x) => x.name), expenseByCat(filteredExpenses().filter((x) => inRange(x.expenseDate, reportFrom, reportTo))).map((x) => x.amount));
}

function nextId(list) {
  return Math.max(0, ...list.map((x) => x.id)) + 1;
}

function pushAudit(action, target, detail) {
  AUDIT_LOGS.unshift({ id: nextId(AUDIT_LOGS), time: new Date().toISOString().slice(0, 16).replace("T", " "), userId: currentUser().id, action, target, detail });
}

function reportRows() {
  let inc = filteredIncomes().filter((x) => inRange(x.incomeDate, reportFrom, reportTo));
  let exp = filteredExpenses().filter((x) => inRange(x.expenseDate, reportFrom, reportTo));
  if (reportSrc) {
    inc = inc.filter((x) => x.source === reportSrc);
    exp = exp.filter((x) => x.source === reportSrc);
  }
  if (reportCat) {
    inc = inc.filter((x) => String(x.categoryId) === String(reportCat));
    exp = exp.filter((x) => String(x.categoryId) === String(reportCat));
  }
  if (reportKind === "INCOME") exp = [];
  if (reportKind === "EXPENSE") inc = [];
  return { inc, exp };
}

function exportInvoice() {
  const { inc, exp } = reportRows();
  const tin = sum(inc);
  const tex = sum(exp);
  const u = currentUser();
  const no = "HD-" + Date.now().toString().slice(-8);
  const incomeRows = inc
    .map(
      (r) =>
        `<tr><td>${dmy(r.incomeDate)}</td><td>${r.description}</td><td>${catName(INCOME_CATEGORIES, r.categoryId)}</td><td style="text-align:right">${money(r.amount)}</td></tr>`
    )
    .join("");
  const expenseRows = exp
    .map(
      (r) =>
        `<tr><td>${dmy(r.expenseDate)}</td><td>${r.description}</td><td>${catName(EXPENSE_CATEGORIES, r.categoryId)}</td><td style="text-align:right">${money(r.amount)}</td></tr>`
    )
    .join("");
  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${no}</title>
    <style>
      body{font-family:Inter,Segoe UI,sans-serif;color:#1e293b;padding:32px;max-width:800px;margin:auto}
      h1{font-size:22px;margin:0} .muted{color:#64748b;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
      th,td{padding:8px;border-bottom:1px solid #e8eef5;text-align:left}
      th{color:#64748b;font-weight:500}
      .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
      .mark{width:36px;height:36px;border-radius:10px;background:#14b8a6;color:#fff;display:grid;place-items:center;font-weight:700}
      .tot{margin-top:16px;text-align:right;font-size:14px}
      .tot b{font-size:18px}
      @media print {.noprint{display:none}}
    </style></head><body>
    <div class="head">
      <div style="display:flex;gap:10px;align-items:center"><div class="mark">H</div>
      <div><h1>Handmade Finance</h1><div class="muted">Hóa đơn tổng hợp thu – chi</div></div></div>
      <div class="muted" style="text-align:right">Số: ${no}<br/>Ngày in: ${new Date().toLocaleString("vi-VN")}<br/>Người xuất: ${u.name}</div>
    </div>
    <p class="muted">Kỳ: ${dmy(reportFrom)} – ${dmy(reportTo)} · Tiền tệ: ${ccy} (không cộng USD với VND)</p>
    <h3>Khoản thu</h3>
    <table><thead><tr><th>Ngày</th><th>Nội dung</th><th>Loại</th><th style="text-align:right">Số tiền</th></tr></thead>
    <tbody>${incomeRows || `<tr><td colspan="4">Không có khoản thu</td></tr>`}</tbody></table>
    <h3>Khoản chi</h3>
    <table><thead><tr><th>Ngày</th><th>Nội dung</th><th>Loại</th><th style="text-align:right">Số tiền</th></tr></thead>
    <tbody>${expenseRows || `<tr><td colspan="4">Không có khoản chi</td></tr>`}</tbody></table>
    <div class="tot">Tổng thu: ${money(tin)}<br/>Tổng chi: ${money(tex)}<br/><b>Chênh lệch: ${money(tin - tex)}</b></div>
    <p class="muted noprint" style="margin-top:24px">Đây là hóa đơn mock để in / lưu PDF. Chưa kết nối máy in thật từ server.</p>
    </body></html>`;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    toast("Trình duyệt chặn cửa sổ in. Hãy cho phép popup.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  toast("Đã mở hóa đơn để in");
}

function bindApp() {
  document.querySelectorAll("[data-go]").forEach((el) => {
    el.onclick = () => go(el.dataset.go);
  });
  document.getElementById("logout-nav")?.addEventListener("click", logout);
  const ccySel = document.getElementById("ccySel") || document.getElementById("fCcy");
  if (ccySel) {
    ccySel.value = ccy;
    ccySel.onchange = () => {
      ccy = ccySel.value;
      renderApp();
    };
  }
  document.querySelectorAll("[data-tab]").forEach((t) => {
    t.onclick = () => {
      reportTab = t.dataset.tab;
      renderApp();
    };
  });
  document.getElementById("rFrom")?.addEventListener("change", (e) => {
    reportFrom = e.target.value;
    renderApp();
  });
  document.getElementById("rTo")?.addEventListener("change", (e) => {
    reportTo = e.target.value;
    renderApp();
  });
  document.getElementById("rKind")?.addEventListener("change", (e) => {
    reportKind = e.target.value;
    reportCat = "";
    renderApp();
  });
  document.getElementById("rSrc")?.addEventListener("change", (e) => {
    reportSrc = e.target.value;
    renderApp();
  });
  document.getElementById("rCat")?.addEventListener("change", (e) => {
    reportCat = e.target.value;
    renderApp();
  });
  document.getElementById("export-invoice")?.addEventListener("click", exportInvoice);
  document.getElementById("xlsx")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    const name = document.getElementById("file-name");
    if (name) name.textContent = f ? f.name : "Chưa chọn tệp";
    const preview = document.getElementById("preview-card");
    if (preview) preview.style.display = "block";
  });
  bindFilters();
  document.querySelectorAll("[data-edit-in]").forEach((b) => (b.onclick = () => go("income-edit", Number(b.dataset.editIn))));
  document.querySelectorAll("[data-edit-ex]").forEach((b) => (b.onclick = () => go("expense-edit", Number(b.dataset.editEx))));
  document.querySelectorAll("[data-del-in]").forEach((b) => {
    b.onclick = () =>
      openConfirm("Bạn có chắc muốn xóa khoản thu này?", () => {
        const id = Number(b.dataset.delIn);
        const i = INCOMES.findIndex((x) => x.id === id);
        if (i >= 0) INCOMES.splice(i, 1);
        pushAudit("Xóa khoản thu", "Khoản thu", `#${id}`);
        toast("Đã xóa khoản thu");
        renderApp();
      });
  });
  document.querySelectorAll("[data-del-ex]").forEach((b) => {
    b.onclick = () =>
      openConfirm("Bạn có chắc muốn xóa khoản chi này?", () => {
        const id = Number(b.dataset.delEx);
        const i = EXPENSES.findIndex((x) => x.id === id);
        if (i >= 0) EXPENSES.splice(i, 1);
        pushAudit("Xóa khoản chi", "Khoản chi", `#${id}`);
        toast("Đã xóa khoản chi");
        renderApp();
      });
  });
  const form = document.getElementById("rec-form");
  if (form && page.startsWith("income")) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const rec = {
        incomeDate: fd.get("incomeDate"),
        description: fd.get("description"),
        categoryId: Number(fd.get("categoryId")),
        amount: Number(fd.get("amount")),
        currency: fd.get("currency"),
        referenceCode: fd.get("referenceCode"),
        source: "MANUAL",
        note: fd.get("note"),
        createdBy: currentUser().id,
      };
      if (page === "income-edit") {
        Object.assign(INCOMES.find((x) => x.id === editId), rec);
        pushAudit("Sửa khoản thu", "Khoản thu", rec.description);
        toast("Đã cập nhật khoản thu");
      } else {
        INCOMES.push({ id: nextId(INCOMES), ...rec });
        pushAudit("Tạo khoản thu", "Khoản thu", rec.description);
        toast("Đã thêm khoản thu");
      }
      go("incomes");
    };
  }
  if (form && page.startsWith("expense")) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const rec = {
        expenseDate: fd.get("expenseDate"),
        description: fd.get("description"),
        categoryId: Number(fd.get("categoryId")),
        amount: Number(fd.get("amount")),
        currency: fd.get("currency"),
        recipient: fd.get("recipient"),
        source: "MANUAL",
        note: fd.get("note"),
        createdBy: currentUser().id,
      };
      if (page === "expense-edit") {
        Object.assign(EXPENSES.find((x) => x.id === editId), rec);
        pushAudit("Sửa khoản chi", "Khoản chi", rec.description);
        toast("Đã cập nhật khoản chi");
      } else {
        EXPENSES.push({ id: nextId(EXPENSES), ...rec });
        pushAudit("Tạo khoản chi", "Khoản chi", rec.description);
        toast("Đã thêm khoản chi");
      }
      go("expenses");
    };
  }
  document.getElementById("do-import")?.addEventListener("click", () => {
    const st = document.getElementById("import-status");
    st.innerHTML = `<span class="spin" style="display:inline-block;vertical-align:middle"></span> Đang import...`;
    setTimeout(() => {
      const type = document.querySelector("input[name=itype]:checked").value;
      const fname = document.getElementById("xlsx")?.files?.[0]?.name || "import-mock.xlsx";
      IMPORTS.unshift({
        id: nextId(IMPORTS),
        fileName: fname,
        type,
        status: "COMPLETED",
        totalRows: 2,
        successRows: 2,
        failedRows: 0,
        createdBy: currentUser().id,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
      pushAudit("Import dữ liệu", "Import", type === "INCOME" ? "Khoản thu" : "Khoản chi");
      toast("Import thành công");
      renderApp();
    }, 900);
  });
  document.getElementById("open-user-modal")?.addEventListener("click", () => {
    document.getElementById("add-user-form").reset();
    document.getElementById("user-modal").classList.add("open");
  });
  document.querySelectorAll("[data-toggle]").forEach((b) => {
    b.onclick = () => {
      const u = USERS.find((x) => x.id === Number(b.dataset.toggle));
      u.status = u.status === "active" ? "disabled" : "active";
      toast("Đã cập nhật trạng thái");
      renderApp();
    };
  });
  document.querySelectorAll("[data-rename]").forEach((b) => {
    b.onclick = () => {
      const u = USERS.find((x) => x.id === Number(b.dataset.rename));
      const n = prompt("Tên mới", u.name);
      if (!n) return;
      u.name = n;
      toast("Đã cập nhật user");
      renderApp();
    };
  });
  document.querySelectorAll("[data-role]").forEach((s) => {
    s.onchange = () => {
      USERS.find((x) => x.id === Number(s.dataset.role)).role = s.value;
      toast("Đã đổi role");
    };
  });
  document.getElementById("profile-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const u = currentUser();
    const full = USERS.find((x) => x.id === u.id);
    full.name = String(fd.get("name"));
    full.avatar = String(fd.get("avatar") || "");
    const { password, ...safe } = full;
    const remember = Boolean(localStorage.getItem("fm_user"));
    saveSession(safe, remember);
    toast("Đã cập nhật hồ sơ");
    renderApp();
  });
}

function bindFilters() {
  const apply = () => {
    const q = (document.getElementById("q")?.value || "").toLowerCase();
    const cat = document.getElementById("fCat")?.value || "";
    const src = document.getElementById("fSrc")?.value || "";
    const from = document.getElementById("fFrom")?.value || "";
    const to = document.getElementById("fTo")?.value || "";
    const user = document.getElementById("fUser")?.value || "";
    const act = document.getElementById("fAct")?.value || "";
    document.querySelectorAll("#rows tr").forEach((tr) => {
      const ok =
        (!q || (tr.dataset.text || "").includes(q)) &&
        (!cat || tr.dataset.cat === cat) &&
        (!src || tr.dataset.src === src) &&
        (!from || !tr.dataset.date || tr.dataset.date >= from) &&
        (!to || !tr.dataset.date || tr.dataset.date <= to) &&
        (!user || tr.dataset.user === user) &&
        (!act || tr.dataset.act === act);
      tr.style.display = ok ? "" : "none";
    });
  };
  ["q", "fCat", "fSrc", "fFrom", "fTo", "fUser", "fAct"].forEach((id) =>
    document.getElementById(id)?.addEventListener(id === "q" ? "input" : "change", apply)
  );
  document.getElementById("clearF")?.addEventListener("click", () => {
    ["q", "fCat", "fSrc", "fFrom", "fTo", "fUser", "fAct"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    apply();
  });
}

document.getElementById("modal-cancel").onclick = closeModal;
document.getElementById("modal-ok").onclick = () => {
  const fn = confirmCb;
  closeModal();
  fn?.();
};
document.getElementById("user-modal-cancel").onclick = () => document.getElementById("user-modal").classList.remove("open");
document.getElementById("new-user-pw-toggle").onclick = () => {
  const inp = document.getElementById("new-user-pw");
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  document.getElementById("new-user-pw-toggle").textContent = show ? "Ẩn" : "Hiện";
};
document.getElementById("user-modal").addEventListener("click", (e) => {
  if (e.target.id === "user-modal") document.getElementById("user-modal").classList.remove("open");
});
document.getElementById("add-user-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  USERS.push({
    id: nextId(USERS),
    name: String(fd.get("name")),
    email: String(fd.get("email")),
    password: String(fd.get("password") || "123456"),
    role: String(fd.get("role")),
    status: "active",
    avatar: "",
  });
  document.getElementById("user-modal").classList.remove("open");
  toast("Đã thêm user");
  if (page === "users") renderApp();
});
document.getElementById("modal-ok").onclick = () => {
  const fn = confirmCb;
  closeModal();
  fn?.();
};
document.getElementById("user-btn").onclick = (e) => {
  e.stopPropagation();
  document.getElementById("user-dd").classList.toggle("open");
};
document.getElementById("logout-dd").onclick = logout;
document.addEventListener("click", () => document.getElementById("user-dd").classList.remove("open"));
document.getElementById("menu-toggle").onclick = () => {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
};
document.getElementById("overlay").onclick = () => {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
};
window.addEventListener("hashchange", route);
if (!location.hash) location.hash = currentUser() ? "#/dashboard" : "#/login";
route();

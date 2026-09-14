let page = "dashboard";
let editId = null;
let editingUserId = null;
let ccy = "USD";
let reportTab = "overview";
let reportFrom = "2026-07-01";
let reportTo = "2026-09-30";
let dashFrom = "2026-07-01";
let dashTo = "2026-09-30";
let reportSrc = "";
let reportKind = "ALL";
let reportCat = "";
const PAGE_SIZE = 10;
let incomePage = 1;
let expensePage = 1;
const listFilter = { q: "", cat: "", src: "", region: "", origin: "", from: "", to: "" };
let colsModalKind = null;
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
  { page: "dashboard", label: "Dashboard", perm: "dashboard" },
  { page: "incomes", label: "Khoản thu", perm: "incomeRead" },
  { page: "expenses", label: "Khoản chi", perm: "expenseRead" },
  { page: "reports", label: "Báo cáo", perm: "reportRead" },
  { page: "import", label: "Import dữ liệu", perm: "importData" },
  { page: "audit", label: "Nhật ký hoạt động", perm: "auditRead" },
];

const TITLES = {
  dashboard: "Dashboard",
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

function toDisplay(n) {
  const v = Number(n) || 0;
  return ccy === "EUR" ? round2(v * FX_USD_TO_EUR) : v;
}
function fromDisplay(n) {
  if (n === "" || n == null) return null;
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  return ccy === "EUR" ? round2(v / FX_USD_TO_EUR) : round2(v);
}
function fromDisplayNum(n, fallback = 0) {
  const v = fromDisplay(n);
  return v == null ? fallback : v;
}
function money(n) {
  const v = toDisplay(n);
  if (ccy === "EUR") return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}
function ccyOptions() {
  return `<option value="USD" ${ccy === "USD" ? "selected" : ""}>USD ($)</option><option value="EUR" ${ccy === "EUR" ? "selected" : ""}>EUR (€)</option>`;
}
function ccyHint() {
  return `Dữ liệu một bộ (USD). Đổi tiền xem: 1 USD = ${FX_USD_TO_EUR} EUR (mock).`;
}
const pctLabel = (n) => `${Number(n) || 0}%`;
function afterTax(amount, pct) {
  return Math.round((Number(amount) || 0) * (1 + (Number(pct) || 0) / 100) * 100) / 100;
}
function afterTaxOf(r) {
  return afterTax(r.amount, r.taxPercent);
}

const INCOME_COLS = [
  { id: "date", label: "Ngày", def: true },
  { id: "product", label: "Sản phẩm", def: true, lock: true },
  { id: "category", label: "Loại thu", def: true },
  { id: "order", label: "Mã đơn", def: true },
  { id: "region", label: "Khu vực", def: true },
  { id: "qty", label: "SL", def: true },
  { id: "item", label: "Item", def: true },
  { id: "discount", label: "Giảm giá", def: true },
  { id: "ship", label: "Ship", def: true },
  { id: "tax", label: "Thuế (tiền)", def: true },
  { id: "amount", label: "Order total", def: true },
  { id: "taxPercent", label: "% thuế", def: true },
  { id: "afterTax", label: "Sau thuế", def: true },
  { id: "source", label: "Nguồn", def: true },
  { id: "creator", label: "Người tạo", def: true },
];
const EXPENSE_COLS = [
  { id: "date", label: "Ngày", def: true },
  { id: "product", label: "Nội dung", def: true, lock: true },
  { id: "category", label: "Loại chi", def: true },
  { id: "payee", label: "Người nhận", def: true },
  { id: "origin", label: "Phạm vi", def: true },
  { id: "amount", label: "Số tiền", def: true },
  { id: "taxPercent", label: "% thuế", def: true },
  { id: "afterTax", label: "Sau thuế", def: true },
  { id: "source", label: "Nguồn", def: true },
  { id: "creator", label: "Người tạo", def: true },
];
function colDefs(kind) {
  return kind === "expense" ? EXPENSE_COLS : INCOME_COLS;
}
function defaultColMap(kind) {
  return Object.fromEntries(colDefs(kind).map((c) => [c.id, Boolean(c.def)]));
}
function loadCols(kind) {
  const defs = colDefs(kind);
  const base = defaultColMap(kind);
  try {
    const saved = JSON.parse(localStorage.getItem("fm_cols_v2_" + kind) || "null");
    if (!saved || typeof saved !== "object") return base;
    defs.forEach((c) => {
      if (c.lock) base[c.id] = true;
      else if (saved[c.id] != null) base[c.id] = Boolean(saved[c.id]);
    });
  } catch (_) {}
  return base;
}
function saveCols(kind, map) {
  localStorage.setItem("fm_cols_v2_" + kind, JSON.stringify(map));
}
function colOn(kind, id) {
  return Boolean(loadCols(kind)[id]);
}
function thCol(kind, id, label, cls) {
  if (!colOn(kind, id)) return "";
  return `<th${cls ? ` class="${cls}"` : ""}>${label}</th>`;
}
function tdCol(kind, id, html, cls) {
  if (!colOn(kind, id)) return "";
  return `<td${cls ? ` class="${cls}"` : ""}>${html}</td>`;
}
function openColsModal(kind) {
  colsModalKind = kind;
  const vis = loadCols(kind);
  const box = document.getElementById("cols-modal-list");
  if (box) {
    box.innerHTML = colDefs(kind)
      .map(
        (c) => `<label class="col-pick${c.lock ? " is-lock" : ""}">
        <input type="checkbox" value="${c.id}" ${vis[c.id] ? "checked" : ""} ${c.lock ? "disabled" : ""} />
        <span>${c.label}${c.lock ? " · luôn hiện" : ""}</span>
      </label>`
      )
      .join("");
  }
  document.getElementById("cols-modal-title").textContent = kind === "expense" ? "Cột danh sách khoản chi" : "Cột danh sách khoản thu";
  document.getElementById("cols-modal")?.classList.add("open");
}
function closeColsModal() {
  colsModalKind = null;
  document.getElementById("cols-modal")?.classList.remove("open");
}
function applyColsModal() {
  if (!colsModalKind) return;
  const map = defaultColMap(colsModalKind);
  document.querySelectorAll("#cols-modal-list input[type=checkbox]").forEach((inp) => {
    map[inp.value] = inp.checked || Boolean(colDefs(colsModalKind).find((c) => c.id === inp.value)?.lock);
  });
  colDefs(colsModalKind).forEach((c) => {
    if (c.lock) map[c.id] = true;
  });
  if (!Object.values(map).some(Boolean)) {
    toast("Chọn ít nhất một cột");
    return;
  }
  saveCols(colsModalKind, map);
  closeColsModal();
  renderApp();
}

function formSectionPrefs() {
  try {
    return JSON.parse(localStorage.getItem("fm_form_sections") || "{}") || {};
  } catch (_) {
    return {};
  }
}
function sectionIsOpen(id, fallback) {
  const p = formSectionPrefs();
  return p[id] == null ? fallback : Boolean(p[id]);
}
function formSection(id, title, sub, inner, defaultOpen) {
  const open = sectionIsOpen(id, defaultOpen);
  return `<div class="form-section${open ? "" : " is-collapsed"}" data-section="${id}">
    <div class="form-section-head">
      <div>
        <h3 class="form-section-title">${title}</h3>
        <p class="muted form-section-sub">${sub}</p>
      </div>
      <button type="button" class="btn ghost section-toggle" data-toggle-section="${id}">${open ? "Ẩn bớt" : "Hiện thêm"}</button>
    </div>
    <div class="form-section-body">${inner}</div>
  </div>`;
}
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function incomeOrderTotal(r) {
  const item = Number(r.itemTotal) || 0;
  const disc = Number(r.discountAmount) || 0;
  const ship = Number(r.shippingAmount) || 0;
  const tax = Number(r.taxAmount) || 0;
  if (!item && !disc && !ship && !tax) return Number(r.amount) || 0;
  return round2(item - disc + ship + tax);
}
function feeLine(r) {
  if (!(Number(r.itemTotal) || Number(r.discountAmount) || Number(r.shippingAmount) || Number(r.taxAmount))) return "";
  const parts = [`Item ${money(r.itemTotal || 0)}`];
  if (Number(r.discountAmount)) parts.push(`giảm ${money(r.discountAmount)}${r.discountCode ? " " + r.discountCode : ""}`);
  parts.push(`subtotal ${money(r.subtotal != null ? r.subtotal : round2((r.itemTotal || 0) - (r.discountAmount || 0)))}`);
  parts.push(`ship ${money(r.shippingAmount || 0)}`);
  parts.push(`thuế ${money(r.taxAmount || 0)}`);
  return parts.join(" · ");
}
function valNum(v) {
  return v === 0 || v ? v : "";
}
const dmy = (iso) => (iso || "").split("-").reverse().join("/");
const srcLabel = (s) => (s === "EXCEL_IMPORT" ? "Excel" : "Nhập tay");
const srcBadge = (s) =>
  s === "EXCEL_IMPORT" ? `<span class="badge mint">Excel</span>` : `<span class="badge">Nhập tay</span>`;
const saleRegionLabel = (v) => (v === "IN_EU" ? "Trong EU" : v === "OUTSIDE_EU" ? "Ngoài EU" : "—");
const originScopeLabel = (v) => (v === "INTERNATIONAL" ? "Quốc tế" : v === "DOMESTIC" ? "Nội địa" : "—");
const originBadge = (v) =>
  v === "INTERNATIONAL" ? `<span class="badge pink">Quốc tế</span>` : v === "DOMESTIC" ? `<span class="badge mint">Nội địa</span>` : "—";
const saleRegionBadge = (v) =>
  v === "IN_EU" ? `<span class="badge mint">Trong EU</span>` : v === "OUTSIDE_EU" ? `<span class="badge">Ngoài EU</span>` : "—";
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

function closeUserModal() {
  editingUserId = null;
  document.getElementById("user-modal")?.classList.remove("open");
}

function openUserModal(id) {
  const form = document.getElementById("add-user-form");
  const modal = document.getElementById("user-modal");
  const pw = document.getElementById("new-user-pw");
  if (!form || !modal) return;
  form.reset();
  editingUserId = id ? Number(id) : null;
  const rec = editingUserId ? USERS.find((x) => x.id === editingUserId) : null;
  const kicker = document.getElementById("user-modal-kicker");
  if (kicker) kicker.innerHTML = rec ? "Cập nhật tài khoản" : "Tài khoản mới";
  document.getElementById("user-modal-title").textContent = rec ? "Sửa người dùng" : "Thêm người dùng";
  document.getElementById("user-modal-sub").textContent = rec
    ? "Chỉnh sửa tên, tài khoản (email) và mật khẩu."
    : "Tạo tài khoản mới với tên, email và mật khẩu.";
  document.getElementById("user-modal-submit").textContent = rec ? "Cập nhật" : "Thêm người dùng";
  const pwReq = document.getElementById("user-pw-req");
  const pwHint = document.getElementById("user-pw-hint");
  if (rec) {
    form.elements.name.value = rec.name;
    form.elements.email.value = rec.email;
    form.elements.role.value = rec.role;
    form.elements.status.value = rec.status === "active" ? "active" : "disabled";
    pw.required = false;
    pw.placeholder = "Để trống nếu giữ mật khẩu hiện tại";
    if (pwReq) pwReq.style.display = "none";
    if (pwHint) pwHint.textContent = "Để trống nếu không đổi mật khẩu.";
  } else {
    form.elements.status.value = "active";
    pw.required = true;
    pw.placeholder = "Nhập mật khẩu";
    if (pwReq) pwReq.style.display = "";
    if (pwHint) pwHint.textContent = "Tối thiểu 4 ký tự.";
  }
  pw.type = "password";
  const tog = document.getElementById("new-user-pw-toggle");
  if (tog) tog.textContent = "Hiện";
  modal.classList.add("open");
  if (window.lucide) lucide.createIcons({ attrs: { width: 16, height: 16, "stroke-width": 1.75 } });
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
    const rec = INCOMES.find((x) => x.id === parsed.id && isActive(x));
    if (!rec || !canEditOwn(rec, "incomeUpdate")) {
      page = "forbidden";
      location.hash = "#/403";
      renderApp();
      return;
    }
  }
  if (parsed.page === "expense-edit") {
    const rec = EXPENSES.find((x) => x.id === parsed.id && isActive(x));
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
          <strong>Finance Manager</strong>
        </div>
        <h1>Đăng nhập</h1>
        <p class="lead">Mock authentication · quản lý thu – chi shop handmade</p>
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
    "income-edit": () => incomeForm(INCOMES.find((x) => x.id === editId && isActive(x))),
    expenses: expenseList,
    "expense-form": () => expenseForm(null),
    "expense-edit": () => expenseForm(EXPENSES.find((x) => x.id === editId && isActive(x))),
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

function isActive(r) {
  return r && !r.deletedAt;
}

function filteredIncomes() {
  return INCOMES.filter(isActive);
}
function filteredExpenses() {
  return EXPENSES.filter(isActive);
}

function sum(list) {
  return list.reduce((a, x) => a + Number(x.amount), 0);
}

function monthKey(iso) {
  return (iso || "").slice(0, 7);
}

function lastDayOfMonth(ym) {
  const [y, m] = String(ym).split("-").map(Number);
  const d = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function monthLabel(key) {
  const m = Number(key.slice(5));
  return Number.isFinite(m) ? `T${m}` : key;
}

function monthlyFrom(inc, exp) {
  const map = {};
  inc.forEach((x) => {
    const k = monthKey(x.incomeDate);
    if (!k) return;
    map[k] = map[k] || { key: k, m: monthLabel(k), income: 0, expense: 0 };
    map[k].income += Number(x.amount);
  });
  exp.forEach((x) => {
    const k = monthKey(x.expenseDate);
    if (!k) return;
    map[k] = map[k] || { key: k, m: monthLabel(k), income: 0, expense: 0 };
    map[k].expense += Number(x.amount);
  });
  return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
}

function monthlySeries() {
  return monthlyFrom(filteredIncomes(), filteredExpenses());
}

function applyCatFilter(inc, exp) {
  if (!reportCat) return { inc, exp };
  if (reportCat.startsWith("INCOME:")) {
    const id = reportCat.slice(7);
    return { inc: inc.filter((x) => String(x.categoryId) === id), exp: [] };
  }
  if (reportCat.startsWith("EXPENSE:")) {
    const id = reportCat.slice(8);
    return { inc: [], exp: exp.filter((x) => String(x.categoryId) === id) };
  }
  return { inc, exp };
}

function catFilterOptions() {
  const opts = [];
  if (reportKind !== "EXPENSE") {
    INCOME_CATEGORIES.forEach((c) => opts.push({ v: `INCOME:${c.id}`, n: `Thu · ${c.name}` }));
  }
  if (reportKind !== "INCOME") {
    EXPENSE_CATEGORIES.forEach((c) => opts.push({ v: `EXPENSE:${c.id}`, n: `Chi · ${c.name}` }));
  }
  return opts;
}

function attachField(existing) {
  const meta = existing
    ? `${existing.name} · ${existing.type || "file"} · ${existing.size || 0} bytes`
    : "Chưa chọn file. Chỉ lưu tên / type / size (không tải lên máy chủ).";
  return `<label class="field span-2"><span>Chứng từ</span>
    <input type="file" id="attach" name="attach" />
    <small class="muted" id="attach-meta">${meta}</small>
  </label>`;
}

function fileMeta(file, fallback) {
  if (!file) return fallback || null;
  return { name: file.name, type: file.type || "", size: file.size || 0 };
}

function isExcelName(name) {
  return /\.(xlsx?|csv)$/i.test(name || "");
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
  const series = monthlySeries();
  const period = series.length
    ? `${series[0].m}${series.length > 1 ? "–" + series[series.length - 1].m : ""}/${series[0].key.slice(0, 4)}`
    : "Chưa có dữ liệu";
  return `<div class="actions" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <label class="pill">Đổi tiền:
      <select id="ccySel">${ccyOptions()}</select>
    </label>
    <span class="pill">${period} · xem ${ccy}</span>
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
  const recentIn = [...inc].sort((a, b) => b.incomeDate.localeCompare(a.incomeDate)).slice(0, 3);
  const recentEx = [...exp].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)).slice(0, 3);
  const series = monthlySeries();
  const chartLabel = series.length
    ? `Thu - chi theo thời gian (${series[0].m}${series.length > 1 ? "–" + series[series.length - 1].m : ""}/${series[0].key.slice(0, 4)})`
    : "Thu - chi theo thời gian";
  return `
    <div class="page-head">
      <div><h1 class="page-title">Dashboard</h1><p class="page-sub">${ccyHint()}</p></div>
      ${ccySelect()}
    </div>
    <div class="kpis">
      <article class="card kpi"><div class="label">Tổng thu</div><div class="row"><div class="value">${money(tin)}</div></div></article>
      <article class="card kpi"><div class="label">Tổng chi</div><div class="row"><div class="value">${money(tex)}</div></div></article>
      <article class="card kpi"><div class="label">Chênh lệch thu - chi</div><div class="row"><div class="value">${money(net)}</div></div></article>
      <article class="card kpi"><div class="label">Số giao dịch</div><div class="row"><div class="value">${tx}</div></div></article>
    </div>
    <div class="grid-2">
      <article class="card">
        <div class="card-head"><h3 class="section-title">${chartLabel}</h3>
          <div class="legend"><span><i class="dot" style="background:#14b8a6"></i>Khoản thu</span><span><i class="dot" style="background:#fb7185"></i>Khoản chi</span></div>
        </div>
        <div class="chart-wrap"><canvas id="barChart"></canvas></div>
      </article>
      <article class="card">
        <h3 class="section-title">Chi theo loại</h3>
        ${byCat.length ? `<div class="chart-sm" style="margin-top:12px"><canvas id="pieChart"></canvas></div>
          <div class="donut-legend" style="margin-top:12px">${byCat.map((x) => `<div class="row-item"><span>${x.name}</span><b class="num">${x.pct}%</b></div>`).join("")}</div>` : `<div class="empty">Chưa có khoản chi.</div>`}
      </article>
    </div>
    <div class="grid-lists">
      <article class="card">
        <div class="card-head"><h3 class="section-title">Khoản thu gần đây</h3><button class="link" data-go="incomes">Xem tất cả</button></div>
        ${recentIn.map((r) => `<div class="row-item"><div><b>${r.description}</b><div class="muted">${dmy(r.incomeDate)} · ${catName(INCOME_CATEGORIES, r.categoryId)}${r.orderCode ? ` · ${r.orderCode}` : ""}${r.productQty ? ` · SL ${r.productQty}` : ""}${feeLine(r) ? " · " + feeLine(r) : ""}</div></div><div class="plus">+${money(r.amount)}</div></div>`).join("") || `<div class="empty">Chưa có khoản thu nào.</div>`}
      </article>
      <article class="card">
        <div class="card-head"><h3 class="section-title">Khoản chi gần đây</h3><button class="link" data-go="expenses">Xem tất cả</button></div>
        ${recentEx.map((r) => `<div class="row-item"><div><b>${r.description}</b><div class="muted">${dmy(r.expenseDate)} · ${catName(EXPENSE_CATEGORIES, r.categoryId)} · ${originScopeLabel(r.originScope)} · thuế ${pctLabel(r.taxPercent)} · sau thuế ${money(afterTaxOf(r))}</div></div><div class="minus">−${money(r.amount)}</div></div>`).join("") || `<div class="empty">Chưa có khoản chi nào.</div>`}
      </article>
    </div>`;
}

function escAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function listedIncomes() {
  const q = listFilter.q.toLowerCase();
  return filteredIncomes()
    .filter((r) => {
      const text = `${r.description} ${r.referenceCode || ""} ${r.orderCode || ""}`.toLowerCase();
      return (
        (!q || text.includes(q)) &&
        (!listFilter.cat || String(r.categoryId) === listFilter.cat) &&
        (!listFilter.src || r.source === listFilter.src) &&
        (!listFilter.region || r.saleRegion === listFilter.region) &&
        (!listFilter.from || r.incomeDate >= listFilter.from) &&
        (!listFilter.to || r.incomeDate <= listFilter.to)
      );
    })
    .sort((a, b) => b.incomeDate.localeCompare(a.incomeDate) || b.id - a.id);
}

function listedExpenses() {
  const q = listFilter.q.toLowerCase();
  return filteredExpenses()
    .filter((r) => {
      const text = `${r.description} ${r.recipient || ""}`.toLowerCase();
      return (
        (!q || text.includes(q)) &&
        (!listFilter.cat || String(r.categoryId) === listFilter.cat) &&
        (!listFilter.src || r.source === listFilter.src) &&
        (!listFilter.origin || r.originScope === listFilter.origin) &&
        (!listFilter.from || r.expenseDate >= listFilter.from) &&
        (!listFilter.to || r.expenseDate <= listFilter.to)
      );
    })
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.id - a.id);
}

function pageSlice(rows, pageNo) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const p = Math.min(Math.max(1, pageNo), pages);
  return { rows: rows.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE), p, pages, total: rows.length };
}

function pagerBar(_kind, p, pages, total) {
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
  btns.push(`<button type="button" class="btn ghost pager-btn" data-list-page="${p + 1}" ${p >= pages ? "disabled" : ""}>Sau</button>`);
  return `<div class="pager"><span class="muted">${from}–${to} / ${total} khoản · ${PAGE_SIZE}/trang</span><div class="pager-pages">${btns.join("")}</div></div>`;
}

function listFilters(kind) {
  const cats = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const catLabel = kind === "income" ? "Loại thu" : "Loại chi";
  const ph = kind === "income" ? "Tìm tên sản phẩm, mã đơn..." : "Tìm nội dung, người nhận...";
  const extra =
    kind === "income"
      ? `<select id="fRegion" class="toolbar-ctrl"><option value="">Khu vực: Tất cả</option><option value="IN_EU" ${listFilter.region === "IN_EU" ? "selected" : ""}>Trong EU</option><option value="OUTSIDE_EU" ${listFilter.region === "OUTSIDE_EU" ? "selected" : ""}>Ngoài EU</option></select>`
      : `<select id="fOrigin" class="toolbar-ctrl"><option value="">Phạm vi: Tất cả</option><option value="DOMESTIC" ${listFilter.origin === "DOMESTIC" ? "selected" : ""}>Nội địa</option><option value="INTERNATIONAL" ${listFilter.origin === "INTERNATIONAL" ? "selected" : ""}>Quốc tế</option></select>`;
  return `
    <div class="toolbar">
      <input id="q" class="toolbar-search" type="search" placeholder="${ph}" value="${escAttr(listFilter.q)}" />
      <select id="fCat" class="toolbar-ctrl"><option value="">${catLabel}: Tất cả</option>${cats.map((c) => `<option value="${c.id}" ${listFilter.cat === String(c.id) ? "selected" : ""}>${c.name}</option>`).join("")}</select>
      <select id="fSrc" class="toolbar-ctrl"><option value="">Nguồn: Tất cả</option><option value="MANUAL" ${listFilter.src === "MANUAL" ? "selected" : ""}>Nhập tay</option><option value="EXCEL_IMPORT" ${listFilter.src === "EXCEL_IMPORT" ? "selected" : ""}>Excel</option></select>
      ${extra}
      <select id="fCcy" class="toolbar-ctrl" title="Đổi tiền">${ccyOptions()}</select>
      <input id="fFrom" class="toolbar-ctrl" type="date" title="Từ ngày" value="${listFilter.from}" />
      <input id="fTo" class="toolbar-ctrl" type="date" title="Đến ngày" value="${listFilter.to}" />
      <button class="btn ghost" type="button" id="clearF">Xóa bộ lọc</button>
    </div>`;
}

function incomeList() {
  const all = listedIncomes();
  const { rows, p, pages, total } = pageSlice(all, incomePage);
  incomePage = p;
  const showAct = can("incomeUpdate") || can("incomeDelete");
  return `
    <div class="page-head">
      <div><h1 class="page-title">Danh sách khoản thu</h1><p class="page-sub">Tổng số: <b>${total}</b> khoản (${ccy}) · 10 dòng / trang</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${can("importData") ? `<button class="btn ghost" data-go="import">Import dữ liệu</button>` : ""}<button class="btn ghost" type="button" id="open-cols-modal">Ẩn / hiện cột</button>${can("incomeCreate") ? `<button class="btn primary" data-go="income-form">+ Thêm khoản thu</button>` : ""}</div>
    </div>
    ${listFilters("income")}
    <article class="card" style="padding:0">
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
          ${thCol("income", "amount", "Order total", "amount")}
          ${thCol("income", "taxPercent", "% thuế", "amount")}
          ${thCol("income", "afterTax", "Sau thuế", "amount")}
          ${thCol("income", "source", "Nguồn")}
          ${thCol("income", "creator", "Người tạo")}
          ${showAct ? "<th>Thao tác</th>" : ""}
        </tr></thead>
        <tbody id="rows">${incomeRows(rows, showAct)}</tbody>
      </table>
      </div>
      ${total ? pagerBar("income", p, pages, total) : `<div class="empty"><strong>Chưa có khoản thu nào.</strong>Thử đổi bộ lọc hoặc thêm khoản mới.</div>`}
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
      return `<tr data-cat="${r.categoryId}" data-src="${r.source}" data-region="${r.saleRegion || ""}" data-date="${r.incomeDate}" data-text="${(r.description + (r.referenceCode || "") + (r.orderCode || "")).toLowerCase()}">
        ${tdCol("income", "date", dmy(r.incomeDate))}
        ${tdCol("income", "product", `<b>${r.description}</b>`, "cell-product")}
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

function expenseList() {
  const all = listedExpenses();
  const { rows, p, pages, total } = pageSlice(all, expensePage);
  expensePage = p;
  const showAct = can("expenseUpdate") || can("expenseDelete");
  return `
    <div class="page-head">
      <div><h1 class="page-title">Danh sách khoản chi</h1><p class="page-sub">Tổng số: <b>${total}</b> khoản (${ccy}) · 10 dòng / trang</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${can("importData") ? `<button class="btn ghost" data-go="import">Import dữ liệu</button>` : ""}<button class="btn ghost" type="button" id="open-cols-modal">Ẩn / hiện cột</button>${can("expenseCreate") ? `<button class="btn primary" data-go="expense-form">+ Thêm khoản chi</button>` : ""}</div>
    </div>
    ${listFilters("expense")}
    <article class="card" style="padding:0">
      <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          ${thCol("expense", "date", "Ngày")}
          ${thCol("expense", "product", "Nội dung")}
          ${thCol("expense", "category", "Loại chi")}
          ${thCol("expense", "payee", "Người nhận")}
          ${thCol("expense", "origin", "Phạm vi")}
          ${thCol("expense", "amount", "Số tiền", "amount")}
          ${thCol("expense", "taxPercent", "% thuế", "amount")}
          ${thCol("expense", "afterTax", "Sau thuế", "amount")}
          ${thCol("expense", "source", "Nguồn")}
          ${thCol("expense", "creator", "Người tạo")}
          ${showAct ? "<th>Thao tác</th>" : ""}
        </tr></thead>
        <tbody id="rows">${expenseRows(rows, showAct)}</tbody>
      </table>
      </div>
      ${total ? pagerBar("expense", p, pages, total) : `<div class="empty"><strong>Chưa có khoản chi nào.</strong></div>`}
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
      return `<tr data-cat="${r.categoryId}" data-src="${r.source}" data-origin="${r.originScope || ""}" data-date="${r.expenseDate}" data-text="${(r.description + (r.recipient || "")).toLowerCase()}">
        ${tdCol("expense", "date", dmy(r.expenseDate))}
        ${tdCol("expense", "product", `<b>${r.description}</b>`, "cell-product")}
        ${tdCol("expense", "category", `<span class="badge pink">${catName(EXPENSE_CATEGORIES, r.categoryId)}</span>`)}
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

function incomeForm(rec) {
  const r = rec || { incomeDate: "2026-09-13", description: "", categoryId: 1, amount: "", currency: "USD", referenceCode: "", orderCode: "", saleRegion: "", productQty: "", unitPrice: "", itemTotal: "", discountAmount: "", discountCode: "", subtotal: "", shippingAmount: "", taxAmount: "", taxPercent: "", amountAfterTax: "", source: "MANUAL", note: "" };
  const openSource = !!(r.orderCode || r.saleRegion || r.productQty || r.unitPrice);
  const openFees = !!(r.itemTotal || r.discountAmount || r.discountCode || r.subtotal || r.shippingAmount || r.taxAmount);
  const openExtra = !!(r.referenceCode || r.note || r.attachment);
  return `
    <div class="page-head">
      <div><h1 class="page-title">${rec ? "Sửa khoản thu" : "Thêm khoản thu"}</h1><p class="page-sub">${ccyHint()}</p></div>
      <button class="btn secondary" data-go="incomes">Quay lại</button>
    </div>
    <form class="card" id="rec-form">
      <div class="form-grid">
        <label class="field"><span>Ngày thu <span class="req">*</span></span><input name="incomeDate" type="date" required value="${r.incomeDate}" /></label>
        <label class="field"><span>Loại thu <span class="req">*</span></span>
          <select name="categoryId">${INCOME_CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === r.categoryId ? "selected" : ""}>${c.name}</option>`).join("")}</select>
        </label>
        <label class="field span-2"><span>Tên sản phẩm <span class="req">*</span></span><input name="description" required value="${r.description || ""}" placeholder="Lily Flower" /></label>
        <label class="field"><span>Số tiền trước thuế (${ccy}) <span class="req">*</span></span><input name="amount" type="number" step="0.01" required value="${valNum(r.amount === "" ? "" : toDisplay(r.amount))}" /></label>
        <label class="field"><span>% thuế</span><input name="taxPercent" type="number" step="0.01" min="0" max="100" value="${valNum(r.taxPercent)}" placeholder="0" /></label>
        <label class="field"><span>Tiền sau thuế (${ccy})</span>
          <input name="amountAfterTax" type="number" step="0.01" readonly tabindex="-1" class="is-computed" value="${r.amount === "" ? "" : toDisplay(afterTax(r.amount, r.taxPercent))}" />
          <small class="muted">Tự tính từ số tiền trước thuế và % thuế, không nhập tay.</small>
        </label>
      </div>
      ${formSection(
        "income-source",
        "Chi tiết nguồn thu",
        "Mã đơn, khu vực bán, số lượng, đơn giá",
        `<div class="form-grid">
          <label class="field"><span>Mã đơn hàng</span><input name="orderCode" value="${r.orderCode || ""}" placeholder="VD: 4154185113" /></label>
          <label class="field"><span>Bán đi đâu</span>
            <select name="saleRegion">
              <option value="" ${!r.saleRegion ? "selected" : ""}>—</option>
              <option value="IN_EU" ${r.saleRegion === "IN_EU" ? "selected" : ""}>Trong EU</option>
              <option value="OUTSIDE_EU" ${r.saleRegion === "OUTSIDE_EU" ? "selected" : ""}>Ngoài EU</option>
            </select>
          </label>
          <label class="field"><span>Số lượng sản phẩm</span><input name="productQty" type="number" min="1" step="1" value="${r.productQty || ""}" /></label>
          <label class="field"><span>Đơn giá (${ccy})</span><input name="unitPrice" type="number" step="0.01" min="0" value="${r.unitPrice === 0 || r.unitPrice ? toDisplay(r.unitPrice) : ""}" placeholder="5.49" /></label>
        </div>`,
        openSource
      )}
      ${formSection(
        "income-fees",
        "Chi tiết phí — Order total",
        "Item − Discount = Subtotal; Subtotal + Shipping + Tax = Số tiền",
        `<div class="form-grid">
          <label class="field"><span>Item total (${ccy})</span><input name="itemTotal" type="number" step="0.01" min="0" value="${r.itemTotal === 0 || r.itemTotal ? toDisplay(r.itemTotal) : ""}" /></label>
          <label class="field"><span>Discount (${ccy})</span><input name="discountAmount" type="number" step="0.01" min="0" value="${r.discountAmount === 0 || r.discountAmount ? toDisplay(r.discountAmount) : ""}" /></label>
          <label class="field"><span>Mã giảm giá</span><input name="discountCode" value="${r.discountCode || ""}" placeholder="AGSALE43" /></label>
          <label class="field"><span>Subtotal (${ccy})</span><input name="subtotal" type="number" step="0.01" min="0" value="${r.subtotal === 0 || r.subtotal ? toDisplay(r.subtotal) : ""}" /></label>
          <label class="field"><span>Shipping (${ccy})</span><input name="shippingAmount" type="number" step="0.01" min="0" value="${r.shippingAmount === 0 || r.shippingAmount ? toDisplay(r.shippingAmount) : ""}" /></label>
          <label class="field"><span>Tax (${ccy})</span><input name="taxAmount" type="number" step="0.01" min="0" value="${r.taxAmount === 0 || r.taxAmount ? toDisplay(r.taxAmount) : ""}" /></label>
        </div>`,
        openFees
      )}
      ${formSection(
        "income-extra",
        "Ghi chú & chứng từ",
        "Mã tham chiếu, ghi chú, file đính kèm",
        `<div class="form-grid">
          <label class="field span-2"><span>Mã tham chiếu</span><input name="referenceCode" value="${r.referenceCode || ""}" /></label>
          <label class="field span-2"><span>Ghi chú</span><textarea name="note">${r.note || ""}</textarea></label>
          ${attachField(r.attachment)}
        </div>`,
        openExtra
      )}
      <div class="form-actions">
        <button type="button" class="btn secondary" data-go="incomes">Hủy</button>
        <button class="btn primary" type="submit">${rec ? "Cập nhật" : "Lưu khoản thu"}</button>
      </div>
    </form>`;
}

function expenseForm(rec) {
  const r = rec || { expenseDate: "2026-09-11", description: "", categoryId: 1, amount: "", currency: "USD", recipient: "", originScope: "DOMESTIC", taxPercent: "", amountAfterTax: "", source: "MANUAL", note: "" };
  const openExtra = !!(r.note || r.attachment);
  return `
    <div class="page-head">
      <div><h1 class="page-title">${rec ? "Sửa khoản chi" : "Thêm khoản chi"}</h1><p class="page-sub">${ccyHint()}</p></div>
      <button class="btn secondary" data-go="expenses">Quay lại</button>
    </div>
    <form class="card" id="rec-form">
      <div class="form-grid">
        <label class="field"><span>Ngày chi <span class="req">*</span></span><input name="expenseDate" type="date" required value="${r.expenseDate}" /></label>
        <label class="field"><span>Loại chi <span class="req">*</span></span>
          <select name="categoryId">${EXPENSE_CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === r.categoryId ? "selected" : ""}>${c.name}</option>`).join("")}</select>
        </label>
        <label class="field span-2"><span>Nội dung <span class="req">*</span></span><input name="description" required value="${r.description || ""}" /></label>
        <label class="field"><span>Số tiền trước thuế (${ccy}) <span class="req">*</span></span><input name="amount" type="number" step="0.01" required value="${valNum(r.amount === "" ? "" : toDisplay(r.amount))}" /></label>
        <label class="field"><span>Người nhận</span><input name="recipient" value="${r.recipient || ""}" /></label>
        <label class="field"><span>% thuế</span><input name="taxPercent" type="number" step="0.01" min="0" max="100" value="${r.taxPercent === 0 || r.taxPercent ? r.taxPercent : ""}" placeholder="0" /></label>
        <label class="field"><span>Tiền sau thuế (${ccy})</span>
          <input name="amountAfterTax" type="number" step="0.01" readonly tabindex="-1" class="is-computed" value="${r.amount === "" ? "" : toDisplay(afterTax(r.amount, r.taxPercent))}" />
          <small class="muted">Tự tính từ số tiền trước thuế và % thuế, không nhập tay.</small>
        </label>
      </div>
      ${formSection(
        "expense-detail",
        "Phạm vi nguồn",
        "Nội địa hoặc quốc tế",
        `<div class="form-grid">
          <label class="field"><span>Phạm vi nguồn <span class="req">*</span></span>
            <select name="originScope">
              <option value="DOMESTIC" ${r.originScope !== "INTERNATIONAL" ? "selected" : ""}>Nội địa</option>
              <option value="INTERNATIONAL" ${r.originScope === "INTERNATIONAL" ? "selected" : ""}>Quốc tế</option>
            </select>
          </label>
        </div>`,
        !!(r.originScope)
      )}
      ${formSection(
        "expense-extra",
        "Ghi chú & chứng từ",
        "Ghi chú và file đính kèm",
        `<div class="form-grid">
          <label class="field span-2"><span>Ghi chú</span><textarea name="note">${r.note || ""}</textarea></label>
          ${attachField(r.attachment)}
        </div>`,
        openExtra
      )}
      <div class="form-actions">
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
  const { inc, exp } = reportRows();
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
  const monthly = monthlyFrom(inc, exp);
  const tabs = [
    ["overview", "Tổng quan"],
    ["daily", "Theo ngày"],
    ["monthly", "Theo tháng"],
    ["in", "Theo loại thu"],
    ["out", "Theo loại chi"],
  ];
  const catOpts = catFilterOptions();
  let body = "";
  if (reportTab === "overview") {
    body = `
      <div class="kpis">
        <article class="card kpi"><div class="label">Tổng thu (${ccy})</div><div class="row"><div class="value">${money(tin)}</div></div></article>
        <article class="card kpi"><div class="label">Tổng chi (${ccy})</div><div class="row"><div class="value">${money(tex)}</div></div></article>
        <article class="card kpi"><div class="label">Chênh lệch thu - chi</div><div class="row"><div class="value">${money(tin - tex)}</div></div></article>
        <article class="card kpi"><div class="label">Số giao dịch</div><div class="row"><div class="value">${inc.length + exp.length}</div></div></article>
      </div>
      <article class="card"><div class="card-head"><h3 class="section-title">Thu - chi theo thời gian (${ccy})</h3></div><div class="chart-wrap"><canvas id="rBar"></canvas></div></article>`;
  } else if (reportTab === "daily") {
    body = `<article class="card" style="padding:0"><div class="table-wrap"><table>
      <thead><tr><th>Ngày</th><th class="amount">Thu</th><th class="amount">Chi</th><th class="amount">Chênh lệch</th></tr></thead>
      <tbody>${
        daily.length
          ? daily.map((x) => `<tr><td>${dmy(x.d)}</td><td class="amount plus">${money(x.income)}</td><td class="amount minus">${money(x.expense)}</td><td class="amount">${money(x.income - x.expense)}</td></tr>`).join("")
          : `<tr><td colspan="4"><div class="empty">Không có dữ liệu trong khoảng ngày.</div></td></tr>`
      }</tbody></table></div></article>`;
  } else if (reportTab === "monthly") {
    body = `<article class="card" style="padding:0"><div class="table-wrap"><table>
      <thead><tr><th>Tháng</th><th class="amount">Thu</th><th class="amount">Chi</th><th class="amount">Chênh lệch</th></tr></thead>
      <tbody>${
        monthly.length
          ? monthly.map((x) => `<tr><td>${x.m}/${x.key.slice(0, 4)}</td><td class="amount plus">${money(x.income)}</td><td class="amount minus">${money(x.expense)}</td><td class="amount">${money(x.income - x.expense)}</td></tr>`).join("")
          : `<tr><td colspan="4"><div class="empty">Không có dữ liệu.</div></td></tr>`
      }</tbody></table></div></article>`;
  } else if (reportTab === "in") {
    const cats = incomeByCat(inc);
    body = `<div class="grid-2"><article class="card"><h3 class="section-title">Theo loại thu</h3><div class="chart-sm"><canvas id="rIn"></canvas></div></article>
      <article class="card"><h3 class="section-title">Chi tiết</h3>${cats.map((x) => `<div class="row-item"><span>${x.name}</span><b class="num">${money(x.amount)}</b></div>`).join("") || `<div class="empty">Chưa có khoản thu.</div>`}</article></div>`;
  } else {
    const cats = expenseByCat(exp);
    body = `<div class="grid-2"><article class="card"><h3 class="section-title">Theo loại chi</h3><div class="chart-sm"><canvas id="rOut"></canvas></div></article>
      <article class="card"><h3 class="section-title">Chi tiết</h3>${cats.map((x) => `<div class="row-item"><span>${x.name}</span><b class="num">${money(x.amount)}</b></div>`).join("") || `<div class="empty">Chưa có khoản chi.</div>`}</article></div>`;
  }
  return `
    <div class="page-head">
      <div><h1 class="page-title">Báo cáo</h1><p class="page-sub">${ccyHint()} Xuất báo cáo = in mock.</p></div>
      <button class="btn primary" type="button" id="export-report">Xuất báo cáo</button>
    </div>
    <div class="toolbar">
      <select id="ccySel" class="toolbar-ctrl" title="Đổi tiền">${ccyOptions()}</select>
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
        ${catOpts.map((c) => `<option value="${c.v}" ${reportCat === c.v ? "selected" : ""}>${c.n}</option>`).join("")}
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
      <div><h1 class="page-title">Import dữ liệu</h1><p class="page-sub">Chỉ nhận Excel (.xlsx / .xls). UI mock — không parse nội dung file.</p></div>
    </div>
    <div class="steps">
      <div class="step"><b>1</b>Chọn loại thu/chi</div>
      <div class="step"><b>2</b>Chọn file Excel</div>
      <div class="step"><b>3</b>Xem trước (mock)</div>
      <div class="step"><b>4</b>Hoàn tất (mock)</div>
    </div>
    <div class="grid-2">
      <article class="card">
        <h3 class="section-title">Tải file lên</h3>
        <div class="radio-row" style="margin:16px 0">
          <label class="choice"><input type="radio" name="itype" value="INCOME" checked /> Khoản thu</label>
          <label class="choice"><input type="radio" name="itype" value="EXPENSE" /> Khoản chi</label>
        </div>
        <label class="dropzone">
          <input type="file" id="xlsx" accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          <b>Chọn hoặc kéo thả file Excel</b>
          <small>.xlsx / .xls · tối đa 10MB · chỉ mô phỏng</small>
          <span class="muted" id="file-name">Chưa chọn tệp</span>
        </label>
        <p class="muted" style="margin-top:12px">File mẫu (placeholder):
          <a class="link" href="samples/mau-khoan-thu.xlsx" download>mau-khoan-thu.xlsx</a>
          ·
          <a class="link" href="samples/mau-khoan-chi.xlsx" download>mau-khoan-chi.xlsx</a>
        </p>
        <button class="btn primary" id="do-import" style="margin-top:16px">Bắt đầu Import</button>
        <div id="import-status" style="margin-top:12px"></div>
      </article>
      <article class="card">
        <h3 class="section-title">Lịch sử import</h3>
        ${IMPORTS.map(
          (b) => `<div class="row-item"><div><b>${b.fileName}</b><div class="muted">${b.type === "INCOME" ? "Khoản thu" : "Khoản chi"} · ${b.createdAt}</div></div>
          <span class="badge ${b.status === "COMPLETED" ? "ok" : "fail"}">${b.status === "COMPLETED" ? "Hoàn thành" : "Thất bại"}</span></div>`
        ).join("")}
      </article>
    </div>
    <article class="card" id="preview-card" style="display:none">
      <div class="card-head"><h3 class="section-title">Xem trước dữ liệu (mock)</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>STT</th><th>Ngày</th><th>Nội dung</th><th>Mã đơn</th><th>SL</th><th class="amount">Item</th><th class="amount">Giảm</th><th class="amount">Ship</th><th class="amount">Thuế</th><th class="amount">Order total</th><th>Trạng thái</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>13/09/2026</td><td>Lily Flower</td><td>4154185113</td><td class="amount">5</td><td class="amount">27.45</td><td class="amount">−12.35</td><td class="amount">7.00</td><td class="amount">0.00</td><td class="amount plus">22.10</td><td><span class="badge ok">Hợp lệ</span></td></tr>
          <tr><td>2</td><td>10/09/2026</td><td>Dòng mẫu 2</td><td>—</td><td class="amount">—</td><td class="amount">—</td><td class="amount">—</td><td class="amount">—</td><td class="amount">—</td><td class="amount plus">120.00</td><td><span class="badge ok">Hợp lệ</span></td></tr>
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
        { label: "Thu", data: monthly.map((x) => toDisplay(x.income)), backgroundColor: "#14b8a6", borderRadius: 4, barPercentage: 0.7 },
        { label: "Chi", data: monthly.map((x) => toDisplay(x.expense)), backgroundColor: "#fb7185", borderRadius: 4, barPercentage: 0.7 },
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
      data: { labels: cats.map((x) => x.name), datasets: [{ data: cats.map((x) => toDisplay(x.amount)), backgroundColor: ["#14b8a6", "#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa"], borderWidth: 0 }] },
      options: { plugins: { legend: { display: false } }, cutout: "68%", maintainAspectRatio: false },
    });
  }
}

function drawReports() {
  const { inc, exp } = reportRows();
  if (reportTab === "overview") {
    const monthly = monthlyFrom(inc, exp);
    const el = document.getElementById("rBar");
    if (!el) return;
    charts.rBar = new Chart(el, {
      type: "bar",
      data: {
        labels: monthly.map((x) => x.m),
        datasets: [
          { data: monthly.map((x) => toDisplay(x.income)), backgroundColor: "#14b8a6", borderRadius: 4 },
          { data: monthly.map((x) => toDisplay(x.expense)), backgroundColor: "#fb7185", borderRadius: 4 },
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
  if (reportTab === "in") doughnut("rIn", incomeByCat(inc).map((x) => x.name), incomeByCat(inc).map((x) => toDisplay(x.amount)));
  if (reportTab === "out") doughnut("rOut", expenseByCat(exp).map((x) => x.name), expenseByCat(exp).map((x) => toDisplay(x.amount)));
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
  if (reportKind === "INCOME") exp = [];
  if (reportKind === "EXPENSE") inc = [];
  return applyCatFilter(inc, exp);
}

function exportReport() {
  const { inc, exp } = reportRows();
  const tin = sum(inc);
  const tex = sum(exp);
  const u = currentUser();
  const no = "BC-" + Date.now().toString().slice(-8);
  const incomeRows = inc
    .map(
      (r) =>
        `<tr><td>${dmy(r.incomeDate)}</td><td>${r.description}</td><td>${r.orderCode || "—"}</td><td>${r.productQty || "—"}</td><td style="text-align:right">${money(r.amount)}</td><td style="text-align:right">${pctLabel(r.taxPercent)}</td><td style="text-align:right">${money(afterTaxOf(r))}</td></tr>`
    )
    .join("");
  const expenseRows = exp
    .map(
      (r) =>
        `<tr><td>${dmy(r.expenseDate)}</td><td>${r.description}</td><td>${catName(EXPENSE_CATEGORIES, r.categoryId)}</td><td>${originScopeLabel(r.originScope)}</td><td style="text-align:right">${money(r.amount)}</td><td style="text-align:right">${pctLabel(r.taxPercent)}</td><td style="text-align:right">${money(afterTaxOf(r))}</td></tr>`
    )
    .join("");
  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Báo cáo ${no}</title>
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
      .amount{font-variant-numeric:tabular-nums}
      @media print {.noprint{display:none}}
    </style></head><body>
    <div class="head">
      <div style="display:flex;gap:10px;align-items:center"><div class="mark">F</div>
      <div><h1>Finance Manager</h1><div class="muted">Báo cáo thu – chi (mock in)</div></div></div>
      <div class="muted" style="text-align:right">Số: ${no}<br/>Ngày in: ${new Date().toLocaleString("vi-VN")}<br/>Người xuất: ${u.name}</div>
    </div>
    <p class="muted">Kỳ: ${dmy(reportFrom)} – ${dmy(reportTo)} · Hiển thị: ${ccy} · ${ccyHint()}</p>
    <h3>Khoản thu</h3>
    <table><thead><tr><th>Ngày</th><th>Nội dung</th><th>Mã đơn</th><th>SL</th><th style="text-align:right">Số tiền</th><th style="text-align:right">% thuế</th><th style="text-align:right">Sau thuế</th></tr></thead>
    <tbody>${incomeRows || `<tr><td colspan="7">Không có khoản thu</td></tr>`}</tbody></table>
    <h3>Khoản chi</h3>
    <table><thead><tr><th>Ngày</th><th>Nội dung</th><th>Loại</th><th>Phạm vi</th><th style="text-align:right">Số tiền</th><th style="text-align:right">% thuế</th><th style="text-align:right">Sau thuế</th></tr></thead>
    <tbody>${expenseRows || `<tr><td colspan="7">Không có khoản chi</td></tr>`}</tbody></table>
    <div class="tot">Tổng thu: ${money(tin)}<br/>Tổng chi: ${money(tex)}<br/><b>Chênh lệch thu - chi: ${money(tin - tex)}</b></div>
    <p class="muted noprint" style="margin-top:24px">Xuất báo cáo mock. Không phải hóa đơn điện tử. Không kết nối máy in từ server.</p>
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
  toast("Đã mở báo cáo để in");
}

function bindApp() {
  document.querySelectorAll("[data-go]").forEach((el) => {
    el.onclick = () => go(el.dataset.go);
  });
  document.getElementById("logout-nav")?.addEventListener("click", logout);
  document.querySelectorAll("[data-list-page]").forEach((btn) => {
    btn.onclick = () => {
      if (btn.disabled) return;
      const n = Number(btn.dataset.listPage);
      if (!Number.isFinite(n) || n < 1) return;
      if (page === "incomes") incomePage = n;
      else if (page === "expenses") expensePage = n;
      renderApp();
    };
  });
  document.getElementById("dashFrom")?.addEventListener("change", (e) => {
    dashFrom = e.target.value;
    renderApp();
  });
  document.getElementById("dashTo")?.addEventListener("change", (e) => {
    dashTo = e.target.value;
    renderApp();
  });
  document.getElementById("rpt-month")?.addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === "all") {
      reportFrom = "2026-07-01";
      reportTo = "2026-09-30";
    } else {
      reportFrom = `${v}-01`;
      reportTo = lastDayOfMonth(v);
    }
    renderApp();
  });
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
  document.getElementById("export-report")?.addEventListener("click", exportReport);
  document.getElementById("xlsx")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    const name = document.getElementById("file-name");
    const preview = document.getElementById("preview-card");
    const st = document.getElementById("import-status");
    if (!f) {
      if (name) name.textContent = "Chưa chọn tệp";
      if (preview) preview.style.display = "none";
      return;
    }
    if (!isExcelName(f.name)) {
      e.target.value = "";
      if (name) name.textContent = "Chưa chọn tệp";
      if (preview) preview.style.display = "none";
      if (st) st.innerHTML = `<div class="alert-error">Chỉ nhận .xlsx, .xls hoặc .csv.</div>`;
      toast("File không phải Excel");
      return;
    }
    if (name) name.textContent = `${f.name} · ${f.type || "Excel"} · ${f.size} bytes`;
    if (preview) preview.style.display = "block";
    if (st) st.innerHTML = "";
  });
  document.getElementById("attach")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    const meta = document.getElementById("attach-meta");
    if (meta && f) meta.textContent = `${f.name} · ${f.type || "file"} · ${f.size} bytes`;
  });
  bindFilters();
  bindExpenseTax();
  bindIncomeFees();
  bindFormSections();
  document.getElementById("open-cols-modal")?.addEventListener("click", () => {
    openColsModal(page === "expenses" ? "expense" : "income");
  });
  document.querySelectorAll("[data-edit-in]").forEach((b) => (b.onclick = () => go("income-edit", Number(b.dataset.editIn))));
  document.querySelectorAll("[data-edit-ex]").forEach((b) => (b.onclick = () => go("expense-edit", Number(b.dataset.editEx))));
  document.querySelectorAll("[data-del-in]").forEach((b) => {
    b.onclick = () =>
      openConfirm("Bạn có chắc muốn xóa khoản thu này?", () => {
        const id = Number(b.dataset.delIn);
        const rec = INCOMES.find((x) => x.id === id);
        if (rec) {
          rec.deletedAt = new Date().toISOString();
          rec.deletedBy = currentUser().id;
        }
        pushAudit("Xóa khoản thu", "Khoản thu", `#${id} (xóa mềm)`);
        toast("Đã xóa mềm khoản thu");
        renderApp();
      });
  });
  document.querySelectorAll("[data-del-ex]").forEach((b) => {
    b.onclick = () =>
      openConfirm("Bạn có chắc muốn xóa khoản chi này?", () => {
        const id = Number(b.dataset.delEx);
        const rec = EXPENSES.find((x) => x.id === id);
        if (rec) {
          rec.deletedAt = new Date().toISOString();
          rec.deletedBy = currentUser().id;
        }
        pushAudit("Xóa khoản chi", "Khoản chi", `#${id} (xóa mềm)`);
        toast("Đã xóa mềm khoản chi");
        renderApp();
      });
  });
  const form = document.getElementById("rec-form");
  if (form && (page === "income-form" || page === "income-edit")) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const now = new Date().toISOString();
      const rec = {
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
        source: "MANUAL",
        note: fd.get("note"),
        attachment: fileMeta(document.getElementById("attach")?.files?.[0], null),
        updatedAt: now,
      };
      if (page === "income-edit") {
        const old = INCOMES.find((x) => x.id === editId);
        Object.assign(old, rec, {
          createdBy: old.createdBy,
          createdAt: old.createdAt,
          deletedAt: old.deletedAt || null,
          deletedBy: old.deletedBy || null,
          attachment: rec.attachment || old.attachment || null,
        });
        pushAudit("Sửa khoản thu", "Khoản thu", rec.description);
        toast("Đã cập nhật khoản thu");
      } else {
        INCOMES.push({
          id: nextId(INCOMES),
          ...rec,
          createdBy: currentUser().id,
          createdAt: now,
          deletedAt: null,
          deletedBy: null,
        });
        pushAudit("Tạo khoản thu", "Khoản thu", rec.description);
        toast("Đã thêm khoản thu");
      }
      go("incomes");
    };
  }
  if (form && (page === "expense-form" || page === "expense-edit")) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const now = new Date().toISOString();
      const rec = {
        expenseDate: fd.get("expenseDate"),
        description: fd.get("description"),
        categoryId: Number(fd.get("categoryId")),
        amount: fromDisplayNum(fd.get("amount")),
        currency: "USD",
        recipient: fd.get("recipient"),
        originScope: String(fd.get("originScope") || "DOMESTIC"),
        taxPercent: Number(fd.get("taxPercent") || 0),
        amountAfterTax: afterTax(fromDisplayNum(fd.get("amount")), fd.get("taxPercent")),
        source: "MANUAL",
        note: fd.get("note"),
        attachment: fileMeta(document.getElementById("attach")?.files?.[0], null),
        updatedAt: now,
      };
      if (page === "expense-edit") {
        const old = EXPENSES.find((x) => x.id === editId);
        Object.assign(old, rec, {
          createdBy: old.createdBy,
          createdAt: old.createdAt,
          deletedAt: old.deletedAt || null,
          deletedBy: old.deletedBy || null,
          attachment: rec.attachment || old.attachment || null,
        });
        pushAudit("Sửa khoản chi", "Khoản chi", rec.description);
        toast("Đã cập nhật khoản chi");
      } else {
        EXPENSES.push({
          id: nextId(EXPENSES),
          ...rec,
          createdBy: currentUser().id,
          createdAt: now,
          deletedAt: null,
          deletedBy: null,
        });
        pushAudit("Tạo khoản chi", "Khoản chi", rec.description);
        toast("Đã thêm khoản chi");
      }
      go("expenses");
    };
  }
  document.getElementById("do-import")?.addEventListener("click", () => {
    const st = document.getElementById("import-status");
    const file = document.getElementById("xlsx")?.files?.[0];
    if (!file) {
      st.innerHTML = `<div class="alert-error">Hãy chọn file Excel.</div>`;
      return;
    }
    if (!isExcelName(file.name)) {
      st.innerHTML = `<div class="alert-error">Chỉ nhận .xlsx, .xls hoặc .csv.</div>`;
      return;
    }
    st.innerHTML = `<span class="spin" style="display:inline-block;vertical-align:middle"></span> Đang import (mock)...`;
    setTimeout(() => {
      const type = document.querySelector("input[name=itype]:checked").value;
      const fail = /fail|sai/i.test(file.name);
      IMPORTS.unshift({
        id: nextId(IMPORTS),
        fileName: file.name,
        type,
        status: fail ? "FAILED" : "COMPLETED",
        totalRows: fail ? 8 : 2,
        successRows: fail ? 0 : 2,
        failedRows: fail ? 8 : 0,
        createdBy: currentUser().id,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
      pushAudit("Import dữ liệu", "Import", `${file.name} · ${fail ? "thất bại mock" : "thành công mock"}`);
      toast(fail ? "Import thất bại (mock)" : "Import thành công (mock — không đọc file)");
      renderApp();
    }, 900);
  });
  document.getElementById("open-user-modal")?.addEventListener("click", () => openUserModal());
  document.querySelectorAll("[data-toggle]").forEach((b) => {
    b.onclick = () => {
      const u = USERS.find((x) => x.id === Number(b.dataset.toggle));
      if (!u) return;
      u.status = u.status === "active" ? "disabled" : "active";
      toast(u.status === "active" ? "Đã kích hoạt tài khoản" : "Đã ngừng kích hoạt");
      renderApp();
    };
  });
  document.querySelectorAll("[data-edit-user]").forEach((b) => {
    b.onclick = () => openUserModal(Number(b.dataset.editUser));
  });
  document.querySelectorAll("[data-rename]").forEach((b) => {
    b.onclick = () => openUserModal(Number(b.dataset.rename));
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
    full.phone = String(fd.get("phone") || "");
    const { password, ...safe } = full;
    const remember = Boolean(localStorage.getItem("fm_user"));
    saveSession(safe, remember);
    toast("Đã cập nhật hồ sơ");
    renderApp();
  });
}

function bindFilters() {
  const onList = page === "incomes" || page === "expenses";
  if (onList) {
    const apply = (resetPage, keepSearchFocus) => {
      const qEl = document.getElementById("q");
      const caret = qEl ? qEl.selectionStart : null;
      listFilter.q = qEl?.value || "";
      listFilter.cat = document.getElementById("fCat")?.value || "";
      listFilter.src = document.getElementById("fSrc")?.value || "";
      listFilter.region = document.getElementById("fRegion")?.value || "";
      listFilter.origin = document.getElementById("fOrigin")?.value || "";
      listFilter.from = document.getElementById("fFrom")?.value || "";
      listFilter.to = document.getElementById("fTo")?.value || "";
      if (resetPage) {
        if (page === "incomes") incomePage = 1;
        else expensePage = 1;
      }
      renderApp();
      const n = document.getElementById("q");
      if (keepSearchFocus && n && caret != null) {
        n.focus();
        try {
          n.setSelectionRange(caret, caret);
        } catch (_) {}
      }
    };
    document.getElementById("q")?.addEventListener("input", () => apply(true, true));
    ["fCat", "fSrc", "fRegion", "fOrigin", "fFrom", "fTo"].forEach((id) =>
      document.getElementById(id)?.addEventListener("change", () => apply(true, false))
    );
    document.getElementById("clearF")?.addEventListener("click", () => {
      Object.assign(listFilter, { q: "", cat: "", src: "", region: "", origin: "", from: "", to: "" });
      if (page === "incomes") incomePage = 1;
      else expensePage = 1;
      renderApp();
    });
    return;
  }
  const apply = () => {
    const q = (document.getElementById("q")?.value || "").toLowerCase();
    const cat = document.getElementById("fCat")?.value || "";
    const src = document.getElementById("fSrc")?.value || "";
    const region = document.getElementById("fRegion")?.value || "";
    const origin = document.getElementById("fOrigin")?.value || "";
    const from = document.getElementById("fFrom")?.value || "";
    const to = document.getElementById("fTo")?.value || "";
    const user = document.getElementById("fUser")?.value || "";
    const act = document.getElementById("fAct")?.value || "";
    document.querySelectorAll("#rows tr").forEach((tr) => {
      const ok =
        (!q || (tr.dataset.text || "").includes(q)) &&
        (!cat || tr.dataset.cat === cat) &&
        (!src || tr.dataset.src === src) &&
        (!region || tr.dataset.region === region) &&
        (!origin || tr.dataset.origin === origin) &&
        (!from || !tr.dataset.date || tr.dataset.date >= from) &&
        (!to || !tr.dataset.date || tr.dataset.date <= to) &&
        (!user || tr.dataset.user === user) &&
        (!act || tr.dataset.act === act);
      tr.style.display = ok ? "" : "none";
    });
  };
  ["q", "fCat", "fSrc", "fRegion", "fOrigin", "fFrom", "fTo", "fUser", "fAct"].forEach((id) =>
    document.getElementById(id)?.addEventListener(id === "q" ? "input" : "change", apply)
  );
  document.getElementById("clearF")?.addEventListener("click", () => {
    ["q", "fCat", "fSrc", "fRegion", "fOrigin", "fFrom", "fTo", "fUser", "fAct"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    apply();
  });
}

function bindExpenseTax() {
  const form = document.getElementById("rec-form");
  if (!form || !form.querySelector('[name="taxPercent"]')) return;
  const amountEl = form.querySelector('[name="amount"]');
  const taxEl = form.querySelector('[name="taxPercent"]');
  const afterEl = form.querySelector('[name="amountAfterTax"]');
  if (!afterEl) return;
  const sync = () => {
    afterEl.value = amountEl?.value === "" ? "" : String(afterTax(amountEl?.value, taxEl?.value));
  };
  amountEl?.addEventListener("input", sync);
  taxEl?.addEventListener("input", sync);
  sync();
}

function bindFormSections() {
  document.querySelectorAll("[data-toggle-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleSection;
      const box = btn.closest(".form-section");
      if (!box) return;
      const willOpen = box.classList.contains("is-collapsed");
      box.classList.toggle("is-collapsed", !willOpen);
      btn.textContent = willOpen ? "Ẩn bớt" : "Hiện thêm";
      const p = formSectionPrefs();
      p[id] = willOpen;
      localStorage.setItem("fm_form_sections", JSON.stringify(p));
    });
  });
}

function bindIncomeFees() {
  const form = document.getElementById("rec-form");
  if (!form || !form.querySelector('[name="itemTotal"]')) return;
  const g = (n) => form.querySelector(`[name="${n}"]`);
  const n = (el) => Number(el?.value) || 0;
  const mark = (el) => {
    el?.addEventListener("input", () => {
      el.dataset.manual = "1";
    });
  };
  mark(g("itemTotal"));
  mark(g("subtotal"));
  mark(g("amount"));
  const sync = () => {
    const qty = n(g("productQty"));
    const unit = n(g("unitPrice"));
    const itemEl = g("itemTotal");
    if (qty && unit && itemEl && !itemEl.dataset.manual) itemEl.value = String(round2(qty * unit));
    const item = n(itemEl);
    const disc = n(g("discountAmount"));
    const subEl = g("subtotal");
    if (subEl && !subEl.dataset.manual) subEl.value = String(round2(item - disc));
    const amt = g("amount");
    if (amt && !amt.dataset.manual) amt.value = String(round2(n(subEl) + n(g("shippingAmount")) + n(g("taxAmount"))));
    const afterEl = g("amountAfterTax");
    if (afterEl) afterEl.value = amt?.value === "" ? "" : String(afterTax(n(amt), n(g("taxPercent"))));
  };
  ["productQty", "unitPrice", "itemTotal", "discountAmount", "subtotal", "shippingAmount", "taxAmount", "taxPercent", "amount"].forEach((name) => {
    g(name)?.addEventListener("input", sync);
  });
}

document.getElementById("cols-cancel").onclick = closeColsModal;
document.getElementById("cols-apply").onclick = applyColsModal;
document.getElementById("cols-reset").onclick = () => {
  if (!colsModalKind) return;
  localStorage.removeItem("fm_cols_v2_" + colsModalKind);
  closeColsModal();
  renderApp();
};
document.getElementById("cols-all").onclick = () => {
  document.querySelectorAll("#cols-modal-list input[type=checkbox]").forEach((inp) => {
    inp.checked = true;
  });
};
document.getElementById("cols-none").onclick = () => {
  document.querySelectorAll("#cols-modal-list input[type=checkbox]").forEach((inp) => {
    if (!inp.disabled) inp.checked = false;
  });
};
document.getElementById("cols-modal").addEventListener("click", (e) => {
  if (e.target.id === "cols-modal") closeColsModal();
});
document.getElementById("modal-cancel").onclick = closeModal;
document.getElementById("modal-ok").onclick = () => {
  const fn = confirmCb;
  closeModal();
  fn?.();
};
document.getElementById("user-modal-cancel").onclick = closeUserModal;
document.getElementById("user-modal-close")?.addEventListener("click", closeUserModal);
document.getElementById("new-user-pw-toggle").onclick = () => {
  const inp = document.getElementById("new-user-pw");
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  document.getElementById("new-user-pw-toggle").textContent = show ? "Ẩn" : "Hiện";
};
document.getElementById("user-modal").addEventListener("click", (e) => {
  if (e.target.id === "user-modal") closeUserModal();
});
document.getElementById("add-user-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim();
  const password = String(fd.get("password") || "");
  const role = String(fd.get("role") || "VIEWER");
  const status = String(fd.get("status") || "active") === "active" ? "active" : "disabled";
  if (!name || !email) {
    toast("Nhập tên và tài khoản");
    return;
  }
  const rec = editingUserId ? USERS.find((x) => x.id === editingUserId) : null;
  if (USERS.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== rec?.id)) {
    toast("Email đã được dùng");
    return;
  }
  if (rec) {
    rec.name = name;
    rec.email = email;
    rec.role = role;
    rec.status = status;
    if (password) rec.password = password;
    const me = currentUser();
    if (me && me.id === rec.id) {
      const { password: _pw, ...safe } = rec;
      saveSession(safe, Boolean(localStorage.getItem("fm_user")));
    }
    pushAudit("Sửa người dùng", "Người dùng", rec.email);
    toast("Đã cập nhật người dùng");
  } else {
    if (!password || password.length < 4) {
      toast("Mật khẩu tối thiểu 4 ký tự");
      return;
    }
    USERS.push({
      id: nextId(USERS),
      name,
      email,
      password,
      role,
      status,
      avatar: "",
    });
    pushAudit("Tạo người dùng", "Người dùng", email);
    toast("Đã thêm người dùng");
  }
  closeUserModal();
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

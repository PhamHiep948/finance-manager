const ROLE_LABEL = {
  ADMIN: "Admin",
  SHOP_OWNER: "Chủ shop",
  EMPLOYEE: "Nhân viên",
  VIEWER: "Người xem",
};

const ROLE_PERMISSIONS = {
  ADMIN: {
    dashboard: true, incomeRead: true, incomeCreate: true, incomeUpdate: true, incomeDelete: true,
    expenseRead: true, expenseCreate: true, expenseUpdate: true, expenseDelete: true,
    reportRead: true, importData: true, auditRead: true, userManagement: true,
  },
  SHOP_OWNER: {
    dashboard: true, incomeRead: true, incomeCreate: true, incomeUpdate: true, incomeDelete: true,
    expenseRead: true, expenseCreate: true, expenseUpdate: true, expenseDelete: true,
    reportRead: true, importData: true, auditRead: true, userManagement: false,
  },
  EMPLOYEE: {
    dashboard: true, incomeRead: true, incomeCreate: true, incomeUpdate: true, incomeDelete: false,
    expenseRead: true, expenseCreate: true, expenseUpdate: true, expenseDelete: false,
    reportRead: false, importData: true, auditRead: false, userManagement: false,
  },
  VIEWER: {
    dashboard: true, incomeRead: true, incomeCreate: false, incomeUpdate: false, incomeDelete: false,
    expenseRead: true, expenseCreate: false, expenseUpdate: false, expenseDelete: false,
    reportRead: true, importData: false, auditRead: false, userManagement: false,
  },
};

const PAGE_PERM = {
  dashboard: "dashboard",
  incomes: "incomeRead",
  "income-form": "incomeCreate",
  "income-edit": "incomeUpdate",
  expenses: "expenseRead",
  "expense-form": "expenseCreate",
  "expense-edit": "expenseUpdate",
  reports: "reportRead",
  import: "importData",
  audit: "auditRead",
  users: "userManagement",
  profile: "dashboard",
  forbidden: "dashboard",
};

function currentUser() {
  const raw = sessionStorage.getItem("fm_user") || localStorage.getItem("fm_user");
  return raw ? JSON.parse(raw) : null;
}

function can(perm) {
  const u = currentUser();
  if (!u) return false;
  return Boolean(ROLE_PERMISSIONS[u.role]?.[perm]);
}

function canEditOwn(record, updatePerm) {
  const u = currentUser();
  if (!u || !can(updatePerm)) return false;
  if (u.role === "EMPLOYEE") return record.createdBy === u.id;
  return true;
}

function canDeleteOwn(record, deletePerm) {
  const u = currentUser();
  if (!u || !can(deletePerm)) return false;
  if (u.role === "EMPLOYEE") return record.createdBy === u.id;
  return true;
}

function saveSession(user, remember) {
  const json = JSON.stringify(user);
  sessionStorage.removeItem("fm_user");
  localStorage.removeItem("fm_user");
  (remember ? localStorage : sessionStorage).setItem("fm_user", json);
}

function clearSession() {
  sessionStorage.removeItem("fm_user");
  localStorage.removeItem("fm_user");
}

function loginMock(email, password) {
  const user = USERS.find((u) => u.email === email && u.password === password && u.status === "active");
  if (!user) return null;
  const { password: _, ...safe } = user;
  return safe;
}

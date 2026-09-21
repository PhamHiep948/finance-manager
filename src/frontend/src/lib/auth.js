export const ROLE_LABEL = {
  ADMIN: "Quản trị viên",
  SHOP_OWNER: "Chủ shop",
  EMPLOYEE: "Nhân viên",
  VIEWER: "Người xem",
};

export const ROLE_PERMISSIONS = {
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

export const PAGE_PERM = {
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

export function readSession() {
  const raw = sessionStorage.getItem("fm_user") || localStorage.getItem("fm_user");
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(user, remember) {
  const json = JSON.stringify(user);
  sessionStorage.removeItem("fm_user");
  localStorage.removeItem("fm_user");
  (remember ? localStorage : sessionStorage).setItem("fm_user", json);
}

export function clearSession() {
  sessionStorage.removeItem("fm_user");
  localStorage.removeItem("fm_user");
}

export function can(user, perm) {
  if (!user) return false;
  return Boolean(ROLE_PERMISSIONS[user.role]?.[perm]);
}

export function canEditOwn(user, record, updatePerm) {
  if (!user || !can(user, updatePerm)) return false;
  if (user.role === "EMPLOYEE") return record.createdBy === user.id;
  return true;
}

export function canDeleteOwn(user, record, deletePerm) {
  if (!user || !can(user, deletePerm)) return false;
  if (user.role === "EMPLOYEE") return record.createdBy === user.id;
  return true;
}

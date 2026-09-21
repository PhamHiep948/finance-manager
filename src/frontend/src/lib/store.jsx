import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./data";
import {
  can as canPerm,
  canDeleteOwn as canDel,
  canEditOwn as canEd,
  clearSession,
  readSession,
  saveSession,
} from "./auth";
import { api, fetchAllPages, setAccessToken, setUnauthorizedHandler } from "./api";
import { afterTax, fromDisplay, fromDisplayNum, isActive } from "./format";

const Ctx = createContext(null);

const CATEGORY_VI = {
  Sales: "Bán hàng",
  "Other Income": "Thu khác",
  "Raw Materials": "Nguyên vật liệu",
  Packaging: "Bao bì / đóng gói",
  Shipping: "Vận chuyển",
  Advertising: "Quảng cáo",
  "Service Fees": "Phí dịch vụ",
  "Employee Salaries": "Lương nhân viên",
  "Electricity / Water / Internet": "Điện / nước / Internet",
  "Premises Rent": "Thuê mặt bằng",
  "Tools / Equipment": "Công cụ / thiết bị",
  "Other Expenses": "Chi khác",
};

const mapUser = (u) => ({
  id: u.id,
  username: u.username,
  name: u.fullName,
  email: u.email,
  role: u.role,
  status: u.isActive ? "active" : "disabled",
  phone: u.phone || "",
  avatar: u.avatarUrl || "",
  timezone: u.timezone,
  lastActive: u.lastLoginAt ? u.lastLoginAt.slice(0, 16).replace("T", " ") : "Chưa từng",
});

const mapLedger = (dateKey) => (r) => ({
  id: r.id,
  [dateKey]: r.date,
  description: r.description,
  categoryId: r.categoryId,
  amount: Number(r.amount),
  currency: r.currencyCode,
  taxPercent: Number(r.taxPercent),
  amountAfterTax: Number(r.amountAfterTax),
  source: "MANUAL",
  note: "",
  attachment: null,
  createdBy: r.createdBy,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  deletedAt: r.deletedAt,
  deletedBy: r.deletedBy,
  orderCode: r.orderCode || "",
  saleRegion: r.saleRegion || "",
  salesChannel: r.salesChannel || "",
  productQty: r.productQty ?? null,
  recipient: r.payee || "",
  originScope: r.originScope || "",
  paymentMethod: r.paymentMethod || "",
});

const toLedgerBody = (dateKey, p) => ({
  date: p[dateKey],
  description: p.description,
  categoryId: p.categoryId,
  amount: p.amount,
  taxPercent: p.taxPercent,
  amountAfterTax: p.amountAfterTax,
  currencyCode: p.currency || "USD",
  orderCode: p.orderCode || null,
  saleRegion: p.saleRegion || null,
  salesChannel: p.salesChannel || null,
  productQty: p.productQty || null,
  payee: p.recipient || null,
  originScope: p.originScope || null,
  paymentMethod: p.paymentMethod || null,
});

const KIND = {
  income: { path: "/incomes", dateKey: "incomeDate", label: "khoản thu" },
  expense: { path: "/expenses", dateKey: "expenseDate", label: "khoản chi" },
};

function initialSession() {
  const s = readSession();
  if (!s?.token) return null;
  setAccessToken(s.token);
  return s;
}

export function FinanceProvider({ children }) {
  const [, setRev] = useState(0);
  const bump = useCallback(() => setRev((n) => n + 1), []);
  const [session, setSession] = useState(initialSession);
  const [ccy, setCcy] = useState("USD");
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [incomeRows, setIncomeRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);
  const [userRows, setUserRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const toast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const logout = useCallback(
    (silent) => {
      clearSession();
      setAccessToken(null);
      setSession(null);
      setIncomeRows([]);
      setExpenseRows([]);
      setUserRows([]);
      if (silent !== true) toast("Đã đăng xuất");
    },
    [toast]
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout(true);
      toast("Phiên đăng nhập đã hết hạn");
    });
  }, [logout, toast]);

  const current = useMemo(() => {
    if (!session) return null;
    const { token, ...rest } = session;
    return rest;
  }, [session]);

  const token = session?.token;
  const role = session?.role;

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [incCats, expCats, inc, exp, users] = await Promise.all([
        api("/categories/income"),
        api("/categories/expense"),
        fetchAllPages("/incomes"),
        fetchAllPages("/expenses"),
        role === "ADMIN" ? api("/users") : Promise.resolve([]),
      ]);
      const label = (c) => ({ id: c.id, name: CATEGORY_VI[c.name] || c.name });
      INCOME_CATEGORIES.splice(0, INCOME_CATEGORIES.length, ...incCats.map(label).sort((a, b) => a.id - b.id));
      EXPENSE_CATEGORIES.splice(0, EXPENSE_CATEGORIES.length, ...expCats.map(label).sort((a, b) => a.id - b.id));
      setIncomeRows(inc.map(mapLedger("incomeDate")));
      setExpenseRows(exp.map(mapLedger("expenseDate")));
      setUserRows(users.map(mapUser));
    } catch (e) {
      if (e.status !== 401) toast(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, role, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const login = useCallback(
    async (email, password, remember) => {
      try {
        const res = await api("/auth/login", { method: "POST", body: { email, password } });
        const next = { ...mapUser(res.user), token: res.accessToken };
        setAccessToken(next.token);
        saveSession(next, remember);
        setSession(next);
        toast("Đăng nhập thành công");
        return { ok: true };
      } catch (e) {
        return { ok: false, message: e.status === 401 ? "Email hoặc mật khẩu không chính xác." : e.message };
      }
    },
    [toast]
  );

  const can = useCallback((perm) => canPerm(current, perm), [current]);
  const canEditOwn = useCallback((rec, p) => canEd(current, rec, p), [current]);
  const canDeleteOwn = useCallback((rec, p) => canDel(current, rec, p), [current]);

  const userName = useCallback(
    (id) => (id === current?.id ? current.name : userRows.find((u) => u.id === id)?.name || "—"),
    [current, userRows]
  );


  const incomes = useMemo(() => incomeRows.filter(isActive), [incomeRows]);
  const expenses = useMemo(() => expenseRows.filter(isActive), [expenseRows]);

  const saveRecord = useCallback(
    async (kind, payload, editId) => {
      const k = KIND[kind];
      try {
        // Form chưa có ô kênh bán / phương thức thanh toán: giữ nguyên giá trị cũ khi sửa.
        const prev = editId ? (kind === "income" ? incomeRows : expenseRows).find((x) => x.id === editId) : null;
        const body = toLedgerBody(k.dateKey, {
          salesChannel: prev?.salesChannel,
          paymentMethod: prev?.paymentMethod,
          ...payload,
        });
        if (editId) await api(`${k.path}/${editId}`, { method: "PUT", body });
        else await api(k.path, { method: "POST", body });
      } catch (e) {
        toast(e.message);
        return false;
      }
      toast(editId ? `Đã cập nhật ${k.label}` : `Đã thêm ${k.label}`);
      await reload();
      return true;
    },
    [incomeRows, expenseRows, reload, toast]
  );

  const saveIncome = useCallback((payload, editId) => saveRecord("income", payload, editId), [saveRecord]);
  const saveExpense = useCallback((payload, editId) => saveRecord("expense", payload, editId), [saveRecord]);

  const softDelete = useCallback(
    async (kind, id) => {
      const k = KIND[kind];
      try {
        await api(`${k.path}/${id}`, { method: "DELETE" });
      } catch (e) {
        toast(e.message);
        return;
      }
      toast(`Đã xóa ${k.label}`);
      await reload();
    },
    [reload, toast]
  );

  const userBody = (u, over) => ({
    username: u.username,
    email: u.email,
    fullName: u.name,
    phone: u.phone || null,
    timezone: u.timezone || "Asia/Ho_Chi_Minh",
    role: u.role,
    isActive: u.status === "active",
    avatarUrl: u.avatar || null,
    ...over,
  });

  const upsertUser = useCallback(
    async (form, editingId) => {
      const rec = editingId ? userRows.find((x) => x.id === editingId) : null;
      try {
        if (rec) {
          await api(`/users/${rec.id}`, {
            method: "PUT",
            body: userBody(rec, {
              email: form.email,
              fullName: form.name,
              role: form.role,
              isActive: form.status === "active",
            }),
          });
          toast("Đã cập nhật người dùng");
        } else {
          if (!form.password || form.password.length < 4) {
            toast("Mật khẩu tối thiểu 4 ký tự");
            return false;
          }
          await api("/users", {
            method: "POST",
            body: {
              username: form.email.split("@")[0],
              email: form.email,
              password: form.password,
              fullName: form.name,
              phone: null,
              timezone: "Asia/Ho_Chi_Minh",
              role: form.role,
              isActive: form.status === "active",
            },
          });
          toast("Đã thêm người dùng");
        }
      } catch (e) {
        toast(e.message);
        return false;
      }
      await reload();
      return true;
    },
    [reload, toast, userRows]
  );

  const toggleUser = useCallback(
    async (id) => {
      const u = userRows.find((x) => x.id === id);
      if (!u) return;
      const nextActive = u.status !== "active";
      try {
        await api(`/users/${id}`, { method: "PUT", body: userBody(u, { isActive: nextActive }) });
      } catch (e) {
        toast(e.message);
        return;
      }
      toast(nextActive ? "Đã kích hoạt tài khoản" : "Đã ngừng kích hoạt");
      await reload();
    },
    [reload, toast, userRows]
  );

  const updateProfile = useCallback(
    async (fields) => {
      try {
        const u = await api("/profile", {
          method: "PUT",
          body: {
            fullName: fields.name,
            phone: fields.phone || null,
            timezone: current.timezone || "Asia/Ho_Chi_Minh",
            avatarUrl: fields.avatar || null,
          },
        });
        const next = { ...mapUser(u), token: session.token };
        saveSession(next, Boolean(localStorage.getItem("fm_user")));
        setSession(next);
        toast("Đã cập nhật hồ sơ");
      } catch (e) {
        toast(e.message);
      }
    },
    [current, session, toast]
  );

  const changePassword = useCallback(
    async (cur, next, confirmPw) => {
      if (next.length < 4 || next !== confirmPw) {
        toast("Mật khẩu mới không khớp hoặc quá ngắn");
        return false;
      }
      try {
        await api("/profile/password", { method: "PUT", body: { currentPassword: cur, newPassword: next } });
      } catch (e) {
        toast(e.message);
        return false;
      }
      toast("Đã cập nhật mật khẩu");
      return true;
    },
    [toast]
  );

  const value = useMemo(
    () => ({
      current,
      ccy,
      setCcy,
      toasts,
      toast,
      confirm,
      setConfirm,
      loading,
      login,
      logout,
      can,
      canEditOwn,
      canDeleteOwn,
      userName,
      incomes,
      expenses,
      allIncomes: incomeRows,
      allExpenses: expenseRows,
      users: userRows,
      saveIncome,
      saveExpense,
      softDelete,
      upsertUser,
      toggleUser,
      updateProfile,
      changePassword,
      reload,
      bump,
      fromDisplay,
      fromDisplayNum,
      afterTax,
    }),
    [
      current, ccy, toasts, toast, confirm, loading, login, logout, can, canEditOwn, canDeleteOwn, userName,
      incomes, expenses, incomeRows, expenseRows, userRows, saveIncome, saveExpense, softDelete,
      upsertUser, toggleUser, updateProfile, changePassword, reload, bump,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFinance() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFinance must be used in FinanceProvider");
  return v;
}

export function incomePayload(fd, ccy) {
  return {
    incomeDate: fd.get("incomeDate"),
    description: fd.get("description"),
    categoryId: Number(fd.get("categoryId")),
    amount: fromDisplayNum(fd.get("amount"), ccy),
    currency: "USD",
    referenceCode: fd.get("referenceCode"),
    orderCode: String(fd.get("orderCode") || "").trim(),
    saleRegion: String(fd.get("saleRegion") || ""),
    productQty: fd.get("productQty") ? Number(fd.get("productQty")) : null,
    unitPrice: fromDisplay(fd.get("unitPrice"), ccy),
    itemTotal: fromDisplay(fd.get("itemTotal"), ccy),
    discountAmount: fromDisplayNum(fd.get("discountAmount"), ccy),
    discountCode: String(fd.get("discountCode") || "").trim(),
    subtotal: fromDisplay(fd.get("subtotal"), ccy),
    shippingAmount: fromDisplayNum(fd.get("shippingAmount"), ccy),
    taxAmount: fromDisplayNum(fd.get("taxAmount"), ccy),
    taxPercent: Number(fd.get("taxPercent") || 0),
    amountAfterTax: afterTax(fromDisplayNum(fd.get("amount"), ccy), fd.get("taxPercent")),
    source: "MANUAL",
    note: fd.get("note"),
  };
}

export function expensePayload(fd, ccy) {
  return {
    expenseDate: fd.get("expenseDate"),
    description: fd.get("description"),
    categoryId: Number(fd.get("categoryId")),
    amount: fromDisplayNum(fd.get("amount"), ccy),
    currency: "USD",
    recipient: fd.get("recipient"),
    originScope: String(fd.get("originScope") || "DOMESTIC"),
    taxPercent: Number(fd.get("taxPercent") || 0),
    amountAfterTax: afterTax(fromDisplayNum(fd.get("amount"), ccy), fd.get("taxPercent")),
    source: "MANUAL",
    note: fd.get("note"),
  };
}

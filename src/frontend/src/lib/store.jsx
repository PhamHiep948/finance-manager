import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  AUDIT_LOGS,
  EXPENSES,
  IMPORTS,
  INCOMES,
  USERS,
} from "./data";
import { UI_USERS } from "./ui-mock";
import {
  can as canPerm,
  canDeleteOwn as canDel,
  canEditOwn as canEd,
  clearSession,
  readSession,
  saveSession,
} from "./auth";
import { afterTax, fileMeta, fromDisplay, fromDisplayNum, isActive, nextId } from "./format";

const Ctx = createContext(null);

function safeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

export function FinanceProvider({ children }) {
  const [, setRev] = useState(0);
  const bump = useCallback(() => setRev((n) => n + 1), []);
  const [session, setSession] = useState(() => readSession());
  const [ccy, setCcy] = useState("USD");
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const toast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const login = useCallback((email, password, remember) => {
    const user = USERS.find((u) => u.email === email && u.password === password && u.status === "active");
    if (!user) return false;
    const safe = safeUser(user);
    saveSession(safe, remember);
    setSession(safe);
    toast("Đăng nhập thành công");
    return true;
  }, [toast]);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    toast("Đã đăng xuất");
  }, [toast]);

  const user = session ? USERS.find((u) => u.id === session.id) || session : null;
  const current = user ? safeUser({ ...user, ...session, avatar: user.avatar ?? session.avatar, name: user.name, phone: user.phone }) : null;

  const can = useCallback((perm) => canPerm(current, perm), [current]);
  const canEditOwn = useCallback((rec, p) => canEd(current, rec, p), [current]);
  const canDeleteOwn = useCallback((rec, p) => canDel(current, rec, p), [current]);

  const userName = useCallback((id) => USERS.find((u) => u.id === id)?.name || "—", []);

  const pushAudit = useCallback(
    (action, target, detail) => {
      AUDIT_LOGS.unshift({
        id: nextId(AUDIT_LOGS),
        time: new Date().toISOString().slice(0, 16).replace("T", " "),
        userId: current?.id,
        action,
        target,
        detail,
      });
    },
    [current]
  );

  const incomes = INCOMES.filter(isActive);
  const expenses = EXPENSES.filter(isActive);

  const saveIncome = useCallback(
    (payload, editId, attachFile) => {
      const now = new Date().toISOString();
      const rec = {
        ...payload,
        attachment: fileMeta(attachFile, null),
        updatedAt: now,
      };
      if (editId) {
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
          createdBy: current.id,
          createdAt: now,
          deletedAt: null,
          deletedBy: null,
        });
        pushAudit("Tạo khoản thu", "Khoản thu", rec.description);
        toast("Đã thêm khoản thu");
      }
      bump();
    },
    [bump, current, pushAudit, toast]
  );

  const saveExpense = useCallback(
    (payload, editId, attachFile) => {
      const now = new Date().toISOString();
      const rec = {
        ...payload,
        attachment: fileMeta(attachFile, null),
        updatedAt: now,
      };
      if (editId) {
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
          createdBy: current.id,
          createdAt: now,
          deletedAt: null,
          deletedBy: null,
        });
        pushAudit("Tạo khoản chi", "Khoản chi", rec.description);
        toast("Đã thêm khoản chi");
      }
      bump();
    },
    [bump, current, pushAudit, toast]
  );

  const softDelete = useCallback(
    (kind, id) => {
      const list = kind === "income" ? INCOMES : EXPENSES;
      const rec = list.find((x) => x.id === id);
      if (rec) {
        rec.deletedAt = new Date().toISOString();
        rec.deletedBy = current.id;
      }
      pushAudit(kind === "income" ? "Xóa khoản thu" : "Xóa khoản chi", kind === "income" ? "Khoản thu" : "Khoản chi", `#${id} (xóa mềm)`);
      toast(kind === "income" ? "Đã xóa mềm khoản thu" : "Đã xóa mềm khoản chi");
      bump();
    },
    [bump, current, pushAudit, toast]
  );

  const mockImport = useCallback(
    (file, type) => {
      const fail = /fail|sai/i.test(file.name);
      IMPORTS.unshift({
        id: nextId(IMPORTS),
        fileName: file.name,
        type,
        status: fail ? "FAILED" : "COMPLETED",
        totalRows: fail ? 8 : 2,
        successRows: fail ? 0 : 2,
        failedRows: fail ? 8 : 0,
        createdBy: current.id,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
      pushAudit("Import dữ liệu", "Import", `${file.name} · ${fail ? "thất bại mock" : "thành công mock"}`);
      toast(fail ? "Import thất bại (mock)" : "Import thành công (mock — không đọc file)");
      bump();
      return !fail;
    },
    [bump, current, pushAudit, toast]
  );

  const upsertUser = useCallback(
    (form, editingId) => {
      const rec = editingId ? USERS.find((x) => x.id === editingId) : null;
      if (USERS.some((u) => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== rec?.id)) {
        toast("Email đã được dùng");
        return false;
      }
      if (rec) {
        rec.name = form.name;
        rec.email = form.email;
        rec.role = form.role;
        rec.status = form.status;
        if (form.password) rec.password = form.password;
        if (current?.id === rec.id) {
          const safe = safeUser(rec);
          saveSession(safe, Boolean(localStorage.getItem("fm_user")));
          setSession(safe);
        }
        pushAudit("Sửa người dùng", "Người dùng", rec.email);
        toast("Đã cập nhật người dùng");
      } else {
        if (!form.password || form.password.length < 4) {
          toast("Mật khẩu tối thiểu 4 ký tự");
          return false;
        }
        USERS.push({
          id: nextId(USERS),
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          status: form.status,
          avatar: "",
        });
        pushAudit("Tạo người dùng", "Người dùng", form.email);
        toast("Đã thêm người dùng");
      }
      bump();
      return true;
    },
    [bump, current, pushAudit, toast]
  );

  const toggleUser = useCallback(
    (id) => {
      const u = USERS.find((x) => x.id === id);
      if (!u) return;
      u.status = u.status === "active" ? "disabled" : "active";
      toast(u.status === "active" ? "Đã kích hoạt tài khoản" : "Đã ngừng kích hoạt");
      bump();
    },
    [bump, toast]
  );

  const updateProfile = useCallback(
    (fields) => {
      const full = USERS.find((x) => x.id === current.id);
      Object.assign(full, fields);
      const safe = safeUser(full);
      saveSession(safe, Boolean(localStorage.getItem("fm_user")));
      setSession(safe);
      toast("Đã cập nhật hồ sơ");
      bump();
    },
    [bump, current, toast]
  );

  const changePassword = useCallback(
    (cur, next, confirmPw) => {
      const full = USERS.find((x) => x.id === current.id);
      if (cur !== full.password) {
        toast("Mật khẩu hiện tại không đúng");
        return false;
      }
      if (next.length < 4 || next !== confirmPw) {
        toast("Mật khẩu mới không khớp hoặc quá ngắn");
        return false;
      }
      full.password = next;
      toast("Đã cập nhật mật khẩu");
      return true;
    },
    [current, toast]
  );

  const ensureUiUsers = useCallback(() => {
    let added = false;
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
      added = true;
    });
    if (added) bump();
  }, [bump]);

  const value = useMemo(
    () => ({
      current,
      ccy,
      setCcy,
      toasts,
      toast,
      confirm,
      setConfirm,
      login,
      logout,
      can,
      canEditOwn,
      canDeleteOwn,
      userName,
      incomes,
      expenses,
      allIncomes: INCOMES,
      allExpenses: EXPENSES,
      imports: IMPORTS,
      audits: AUDIT_LOGS,
      users: USERS,
      saveIncome,
      saveExpense,
      softDelete,
      mockImport,
      upsertUser,
      toggleUser,
      updateProfile,
      changePassword,
      ensureUiUsers,
      bump,
      fromDisplay,
      fromDisplayNum,
      afterTax,
    }),
    [
      current, ccy, toasts, toast, confirm, login, logout, can, canEditOwn, canDeleteOwn, userName,
      incomes, expenses, saveIncome, saveExpense, softDelete, mockImport, upsertUser, toggleUser,
      updateProfile, changePassword, ensureUiUsers, bump,
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

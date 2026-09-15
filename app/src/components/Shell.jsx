import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { I } from "../lib/icons";
import { initials, roleUi } from "../lib/format";
import { UI_MOCK } from "../lib/ui-mock";
import { useFinance } from "../lib/store";

const NAV = [
  { to: "/dashboard", label: "Tổng quan", perm: "dashboard", icon: "layout-dashboard" },
  { to: "/incomes", label: "Khoản thu", perm: "incomeRead", icon: "trending-up" },
  { to: "/expenses", label: "Khoản chi", perm: "expenseRead", icon: "trending-down" },
  { to: "/reports", label: "Báo cáo", perm: "reportRead", icon: "pie-chart" },
  { to: "/import", label: "Import Excel", perm: "importData", icon: "file-spreadsheet" },
  { to: "/audit", label: "Nhật ký", perm: "auditRead", icon: "scroll-text" },
  { to: "/users", label: "Người dùng", perm: "userManagement", icon: "users" },
];

export default function Shell() {
  const { current, can, logout, confirm, setConfirm } = useFinance();
  const nav = useNavigate();
  const [dd, setDd] = useState(false);
  const displayName = current.role === "ADMIN" ? UI_MOCK.displayName : current.name;
  const mark = initials(displayName);

  useEffect(() => {
    localStorage.removeItem("fm_rail");
    document.documentElement.classList.remove("rail-min");
  }, []);

  useEffect(() => {
    const close = () => setDd(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  function go(path) {
    setDd(false);
    nav(path);
  }

  return (
    <>
      <aside className="sidebar">
        <nav className="nav">
          {NAV.filter((n) => can(n.perm)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              title={n.label}
              className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
            >
              <I name={n.icon} />
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-account">
            <NavLink to="/profile" title="Hồ sơ" className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}>
              <I name="user-cog" />
              <span className="nav-label">Hồ sơ</span>
            </NavLink>
            <div className="user-menu user-chip-wrap">
            <button className="user-chip" type="button" title={displayName} onClick={(e) => { e.stopPropagation(); setDd((v) => !v); }}>
              <span className="avatar">{mark}</span>
              <div className="chip-meta">
                <strong>{displayName}</strong>
                <small className="chip-role">{roleUi(current.role)}</small>
              </div>
            </button>
            {dd ? (
              <div className="dropdown open" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => go("/profile")}>Hồ sơ</button>
                <button
                  type="button"
                  onClick={() => {
                    setDd(false);
                    logout();
                    nav("/login");
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <section className="page"><Outlet /></section>
      </div>
      <div className={`modal-back${confirm ? " open" : ""}`} onClick={() => setConfirm(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Xác nhận</h3>
          <p>{confirm?.text}</p>
          <div className="modal-actions">
            <button className="btn secondary" type="button" onClick={() => setConfirm(null)}>Hủy</button>
            <button className="btn danger" type="button" onClick={() => { const fn = confirm?.onOk; setConfirm(null); fn?.(); }}>Xóa</button>
          </div>
        </div>
      </div>
    </>
  );
}

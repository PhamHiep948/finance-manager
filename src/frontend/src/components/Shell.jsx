import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { I } from "../lib/icons";
import { initials, roleUi } from "../lib/format";
import { UI_MOCK } from "../lib/ui-mock";
import { useFinance } from "../lib/store";

const NAV_GROUPS = [
  {
    label: "MENU CHÍNH",
    items: [
      { to: "/dashboard", label: "Tổng quan", perm: "dashboard", icon: "layout-dashboard" },
      { to: "/incomes", label: "Khoản thu", perm: "incomeRead", icon: "trending-up" },
      { to: "/expenses", label: "Khoản chi", perm: "expenseRead", icon: "trending-down" },
      { to: "/reports", label: "Báo cáo", perm: "reportRead", icon: "pie-chart" },
      { to: "/import", label: "Import Excel", perm: "importData", icon: "file-spreadsheet" },
    ],
  },
  {
    label: "HỖ TRỢ & CÀI ĐẶT",
    items: [
      { to: "/audit", label: "Nhật ký hoạt động", perm: "auditRead", icon: "history" },
      { to: "/users", label: "Quản lý người dùng", perm: "userManagement", icon: "users" },
      { to: "/profile", label: "Cài đặt & Hồ sơ", perm: "dashboard", icon: "user-cog" },
    ],
  },
];

export default function Shell() {
  const { current, can, logout, confirm, setConfirm } = useFinance();
  const nav = useNavigate();
  const location = useLocation();
  const [dd, setDd] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fm_theme") === "dark");
  const displayName = current.role === "ADMIN" ? UI_MOCK.displayName : current.name;
  const mark = initials(displayName);

  const PAGE_METAS = {
    "/dashboard": { breadcrumb: "Tổng quan", desc: "Tổng quan tình hình tài chính & kinh doanh" },
    "/incomes": { breadcrumb: "Khoản thu", desc: "Quản lý doanh thu từ đơn hàng & bán lẻ" },
    "/expenses": { breadcrumb: "Khoản chi", desc: "Theo dõi chi phí hoạt động & đối soát thuế" },
    "/reports": { breadcrumb: "Báo cáo", desc: "Báo cáo tài chính & phân tích lợi nhuận" },
    "/import": { breadcrumb: "Import Excel", desc: "Nhập dữ liệu giao dịch hàng loạt từ Excel" },
    "/audit": { breadcrumb: "Nhật ký hoạt động", desc: "Lịch sử thao tác & kiểm toán hệ thống" },
    "/users": { breadcrumb: "Quản lý người dùng", desc: "Danh sách thành viên & phân quyền tài khoản" },
    "/profile": { breadcrumb: "Hồ sơ cá nhân", desc: "Thông tin cá nhân & cài đặt tài khoản" },
  };

  const pageMeta = PAGE_METAS[location.pathname] || {
    breadcrumb: "Tổng quan",
    desc: "Tổng quan tình hình tài chính & kinh doanh",
  };

  useEffect(() => {
    localStorage.removeItem("fm_rail");
    document.documentElement.classList.remove("rail-min");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("fm_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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
      <aside className="sidebar-new">
        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-brand-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div className="sb-brand-text">
            <span className="sb-brand-name">HandmadeFinance</span>
            <span className="sb-brand-sub">Quản lý tài chính</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav-new">
          {NAV_GROUPS.map((group) => {
            const visible = group.items.filter((n) => can(n.perm));
            if (!visible.length) return null;
            return (
              <div key={group.label} className="nav-group-new">
                {visible.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    title={n.label}
                    className={({ isActive }) => `nav-btn-new${isActive ? " active" : ""}`}
                  >
                    <I name={n.icon} size={18} />
                    <span className="nav-label-new">{n.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-foot-new">
          <div className="sb-user-wrap user-menu">
            <button
              className="sb-user-btn"
              type="button"
              onClick={(e) => { e.stopPropagation(); setDd((v) => !v); }}
            >
              <span className="sb-avatar">{mark}</span>
              <div className="sb-user-meta">
                <strong>{displayName}</strong>
                <small>{roleUi(current.role)}</small>
              </div>
              <I name={dd ? "chevron-down" : "chevron-up"} size={14} />
            </button>
            {dd && (
              <div className="dropdown sb-user-dropdown open" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => go("/profile")}>
                  <I name="user-cog" size={15} />
                  <span>Hồ sơ cá nhân</span>
                </button>
                <div className="dropdown-divider" />
                <button
                  type="button"
                  className="btn-logout"
                  onClick={() => { setDd(false); logout(); nav("/login"); }}
                >
                  <I name="log-out" size={15} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="workspace-new">
        <header className="workspace-topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb-row">
              <div className="topbar-breadcrumb">
                <NavLink to="/dashboard" className="topbar-root" title="Về trang Dashboard">
                  <I name="layout-dashboard" size={14} />
                  <span>Dashboard</span>
                </NavLink>
                {location.pathname !== "/dashboard" && (
                  <>
                    <span className="topbar-sep">/</span>
                    <span className="topbar-cur">{pageMeta.breadcrumb}</span>
                  </>
                )}
              </div>
            </div>
            <div className="topbar-subtitle">{pageMeta.desc}</div>
          </div>

          <div className="topbar-right">
            <label className="workspace-search">
              <I name="search" size={15} />
              <input type="search" placeholder="Tìm kiếm nhanh..." aria-label="Tìm kiếm nhanh" />
            </label>

            <div className="workspace-tools">
              <button
                type="button"
                className="workspace-tool-btn has-badge"
                aria-label="Thông báo"
                title="Thông báo"
              >
                <I name="bell" size={17} />
                <span className="tool-badge-dot" />
              </button>

              <button
                type="button"
                className="workspace-tool-btn"
                aria-label={darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
                title={darkMode ? "Giao diện sáng" : "Giao diện tối"}
                aria-pressed={darkMode}
                onClick={() => setDarkMode((value) => !value)}
              >
                <I name={darkMode ? "sun" : "moon"} size={17} />
              </button>

              <button
                type="button"
                className="workspace-top-avatar"
                aria-label="Mở hồ sơ"
                title={displayName}
                onClick={() => go("/profile")}
              >
                {mark}
              </button>
            </div>
          </div>
        </header>

        <section className="page"><Outlet /></section>
      </div>

      <div className={`modal-back${confirm ? " open" : ""}`} onClick={() => setConfirm(null)}>
        <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
          <div className="modal-confirm-icon"><I name="triangle-alert" /></div>
          <h3>Xác nhận xóa</h3>
          <p>{confirm?.text}</p>
          <div className="modal-actions">
            <button className="btn secondary" type="button" onClick={() => setConfirm(null)}>Hủy bỏ</button>
            <button className="btn danger" type="button" onClick={() => { const fn = confirm?.onOk; setConfirm(null); fn?.(); }}>
              <I name="trash-2" /> Xóa vĩnh viễn
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

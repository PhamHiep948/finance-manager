import { useEffect, useMemo, useState } from "react";
import { I } from "../lib/icons";
import { initials, roleUi } from "../lib/format";
import { UI_USERS } from "../lib/ui-mock";
import { ROLE_LABEL } from "../lib/auth";
import { useFinance } from "../lib/store";
import { Kpi } from "./Dashboard";

function RolePill({ role }) {
  return <span className="role-text">{roleUi(role)}</span>;
}

export default function UsersPage() {
  const { users, ensureUiUsers, toggleUser, upsertUser } = useFinance();
  useEffect(() => { ensureUiUsers(); }, [ensureUiUsers]);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [showPw, setShowPw] = useState(false);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return users.filter((u) => {
      const active = u.status === "active";
      if (tab === "active" && !active) return false;
      if (tab === "disabled" && active) return false;
      if (qq && !`${u.name} ${u.email}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [users, tab, q]);

  const total = users.length;
  const kpis = [
    { label: "Tổng số", value: String(total), icon: "users", tone: "blue" },
    { label: "Quản trị", value: String(users.filter((u) => u.role === "ADMIN").length), icon: "shield", tone: "indigo" },
    { label: "Hoạt động", value: String(users.filter((u) => u.status === "active").length), icon: "check-circle", tone: "green" },
    { label: "Ngừng kích hoạt", value: String(users.filter((u) => u.status !== "active").length), icon: "power", tone: "orange" },
  ];
  const rec = modal?.id ? users.find((u) => u.id === modal.id) : null;

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const ok = upsertUser({
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      password: String(fd.get("password") || ""),
      role: String(fd.get("role") || "VIEWER"),
      status: String(fd.get("status") || "active") === "active" ? "active" : "disabled",
    }, rec?.id);
    if (ok) setModal(null);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-sub">Quản lý quyền truy cập, vai trò và trạng thái của các thành viên trong hệ thống.</p>
        </div>
        <div className="head-actions">
          <button className="btn ghost" type="button"><I name="download" /> Xuất dữ liệu</button>
          <button className="btn primary" type="button" onClick={() => setModal({})}><I name="plus" /> Thêm người dùng</button>
        </div>
      </div>
      <div className="kpis">{kpis.map((k) => <Kpi key={k.label} {...k} />)}</div>
      <div className="toolbar">
        <label className="search-box toolbar-search"><I name="search" /><input type="search" placeholder="Tìm theo tên hoặc email..." value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="seg-tabs">
          {[["all", "Tất cả"], ["active", "Hoạt động"], ["disabled", "Ngừng kích hoạt"]].map(([k, l]) => (
            <button key={k} className={`tab ${tab === k ? "on" : ""}`} type="button" onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      <article className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="users-table">
            <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Hoạt động gần nhất</th><th>Thao tác</th></tr></thead>
            <tbody>
              {rows.map((u) => {
                const last = UI_USERS.find((x) => x.email === u.email)?.last || u.lastActive || "Vừa xong";
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <span className="avatar user-initials" aria-hidden="true">{initials(u.name)}</span>
                        <div className="meta"><b>{u.name}</b><small>{u.email}</small></div>
                      </div>
                    </td>
                    <td><RolePill role={u.role} /></td>
                    <td>{u.status === "active" ? <span className="badge ok"><I name="check-circle" size={12} /> Đang hoạt động</span> : <span className="badge fail"><I name="circle-off" size={12} /> Ngừng kích hoạt</span>}</td>
                    <td className="muted">{last}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" type="button" title={u.status === "active" ? "Ngừng kích hoạt" : "Kích hoạt lại"} onClick={() => toggleUser(u.id)}><I name="power" /></button>
                        <button className="icon-btn" type="button" title="Sửa" onClick={() => setModal({ id: u.id })}><I name="pencil" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
      <div className="role-cards">
        <article className="card"><h3>Quản trị viên</h3><p className="muted">Quyền hạn cao nhất. Có thể quản lý người dùng, thiết lập hệ thống, xem báo cáo và chỉnh sửa tất cả dữ liệu thu chi.</p></article>
        <article className="card"><h3>Nhân viên</h3><p className="muted">Quản lý vận hành. Có thể thêm mới, chỉnh sửa các khoản thu chi và xem báo cáo cơ bản.</p></article>
        <article className="card"><h3>Người xem</h3><p className="muted">Chỉ đọc. Chỉ có quyền xem danh sách và báo cáo.</p></article>
      </div>
      <div className={`modal-back${modal ? " open" : ""}`} onClick={() => setModal(null)}>
        <div className="form-window user-window" onClick={(e) => e.stopPropagation()}>
          <div className="form-window-head">
            <div>
              <div className="exp-kicker">{rec ? "Cập nhật tài khoản" : "Tài khoản mới"}</div>
              <h2>{rec ? "Sửa người dùng" : "Thêm người dùng"}</h2>
              <p className="muted">{rec ? "Chỉnh sửa tên, tài khoản (email) và mật khẩu." : "Tạo tài khoản mới với tên, email và mật khẩu."}</p>
            </div>
            <button className="icon-ghost" type="button" aria-label="Đóng" onClick={() => setModal(null)}><I name="x" /></button>
          </div>
          {modal ? (
            <form className="form-window-body" onSubmit={onSubmit}>
              <div className="form-grid">
                <label className="field span-2"><span>Tên hiển thị <span className="req">*</span></span><input name="name" type="text" required defaultValue={rec?.name || ""} placeholder="Nguyễn Văn A" /></label>
                <label className="field span-2"><span>Tài khoản (email) <span className="req">*</span></span><input name="email" type="email" required defaultValue={rec?.email || ""} placeholder="user@demo.local" /></label>
                <label className="field span-2">
                  <span>Mật khẩu {rec ? null : <span className="req">*</span>}</span>
                  <div className="pw-wrap">
                    <input name="password" type={showPw ? "text" : "password"} minLength={rec ? undefined : 4} placeholder={rec ? "Để trống nếu giữ mật khẩu hiện tại" : "Nhập mật khẩu"} />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>{showPw ? "Ẩn" : "Hiện"}</button>
                  </div>
                </label>
                <label className="field"><span>Vai trò</span>
                  <select name="role" defaultValue={rec?.role || "VIEWER"}>
                    {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="field"><span>Trạng thái</span>
                  <select name="status" defaultValue={rec?.status === "disabled" ? "disabled" : "active"}>
                    <option value="active">Đang hoạt động</option>
                    <option value="disabled">Ngừng kích hoạt</option>
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button className="btn secondary" type="button" onClick={() => setModal(null)}>Hủy</button>
                <button className="btn primary" type="submit">{rec ? "Cập nhật" : "Thêm người dùng"}</button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </>
  );
}

export { RolePill };

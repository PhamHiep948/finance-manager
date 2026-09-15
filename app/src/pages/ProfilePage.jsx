import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { I } from "../lib/icons";
import { roleUi } from "../lib/format";
import { AVATAR_ADMIN, UI_MOCK } from "../lib/ui-mock";
import { useFinance } from "../lib/store";
import { RolePill } from "./UsersPage";

export default function ProfilePage() {
  const { current, can, updateProfile, changePassword, toast } = useFinance();
  const nav = useNavigate();
  const [tab, setTab] = useState("account");
  const [picker, setPicker] = useState(false);
  const [avatar, setAvatar] = useState(current.avatar || AVATAR_ADMIN);
  const displayName = current.role === "ADMIN" ? UI_MOCK.displayName : current.name;
  const displayEmail = current.email === "admin@demo.local" ? "nguyen.handmade@finance.vn" : current.email;
  const uid = `#${(current.role === "ADMIN" ? "ADM" : current.role === "SHOP_OWNER" ? "OWN" : current.role === "EMPLOYEE" ? "EMP" : "VEW")}-${String(current.id).padStart(3, "0")}`;
  const permRows = [
    ["dashboard", "Dashboard"], ["incomeRead", "Xem khoản thu"], ["incomeCreate", "Thêm / sửa khoản thu"],
    ["expenseRead", "Xem khoản chi"], ["expenseCreate", "Thêm / sửa khoản chi"], ["reportRead", "Xem báo cáo"],
    ["importData", "Import Excel"], ["auditRead", "Nhật ký hoạt động"], ["userManagement", "Quản lý người dùng"],
  ];

  function saveAccount(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    updateProfile({ name: String(fd.get("name")), phone: String(fd.get("phone") || ""), avatar });
  }
  function savePw(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    changePassword(String(fd.get("current") || ""), String(fd.get("next") || ""), String(fd.get("confirm") || ""));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hồ sơ cá nhân</h1>
          <p className="page-sub">Quản lý thông tin định danh, bảo mật và quyền hạn truy cập hệ thống.</p>
        </div>
        <div className="head-actions">
          <button className="btn ghost" type="button" onClick={() => nav("/dashboard")}>Hủy bỏ</button>
          {tab !== "roles" ? <button className="btn primary" type="submit" form={tab === "security" ? "security-form" : "profile-form"}><I name="save" /> {tab === "security" ? "Lưu mật khẩu" : "Lưu thay đổi"}</button> : null}
        </div>
      </div>
      <div className="profile-tabs">
        {[["account", "Tài khoản"], ["security", "Bảo mật"], ["roles", "Vai trò & Quyền hạn"]].map(([k, l]) => (
          <button key={k} type="button" className={`tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === "account" ? (
        <div className="profile-account">
          <div className="profile-grid">
            <article className="card profile-side">
              <div className="avatar-wrap">
                <span className="avatar lg"><img src={avatar} alt="" /></span>
                <button className="cam-btn" type="button" title="Đổi ảnh" onClick={() => setPicker((v) => !v)}><I name="camera" size={12} /></button>
              </div>
              {picker ? (
                <div className="avatar-picker open">
                  <p>Đổi ảnh đại diện</p>
                  <button className="btn ghost sm avatar-file-btn" type="button" onClick={() => document.getElementById("avatar-file")?.click()}><I name="image" /> Chọn ảnh từ máy</button>
                  <input id="avatar-file" type="file" accept="image/*" hidden onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => { setAvatar(String(reader.result || "")); toast("Đã chọn ảnh. Bấm Lưu thay đổi để cập nhật."); };
                    reader.readAsDataURL(f);
                  }} />
                  <label className="field"><span>Hoặc dán URL ảnh</span><input id="avatar-url" type="url" placeholder="https://..." defaultValue={String(avatar).startsWith("http") ? avatar : ""} /></label>
                  <button className="btn primary sm" type="button" style={{ marginTop: 8, width: "100%" }} onClick={() => {
                    const url = String(document.getElementById("avatar-url")?.value || "").trim();
                    if (!url) { toast("Nhập URL ảnh hoặc chọn file từ máy"); return; }
                    setAvatar(url);
                    toast("Đã gắn ảnh. Bấm Lưu thay đổi để cập nhật.");
                  }}>Dùng ảnh này</button>
                </div>
              ) : null}
              <h3>{displayName}</h3>
              <p className="muted">{roleUi(current.role)}</p>
              <p className="profile-badges"><span className="badge ok">Hoạt động</span> <span className="badge info">ID: {uid}</span></p>
            </article>
            <article className="card profile-detail">
              <h3 className="section-title">Chi tiết cá nhân</h3>
              <form id="profile-form" onSubmit={saveAccount}>
                <div className="form-grid">
                  <label className="field"><span className="lab"><I name="user" /> Họ và tên</span><input name="name" defaultValue={displayName} required /></label>
                  <label className="field"><span className="lab"><I name="mail" /> Địa chỉ Email</span><input defaultValue={displayEmail} disabled /></label>
                  <label className="field"><span className="lab"><I name="phone" /> Số điện thoại</span><input name="phone" defaultValue={current.phone || "090 123 4567"} /></label>
                  <label className="field"><span className="lab"><I name="briefcase" /> Chức vụ</span><input defaultValue={roleUi(current.role)} disabled /></label>
                </div>
              </form>
            </article>
          </div>
        </div>
      ) : null}
      {tab === "security" ? (
        <article className="card">
          <h3 className="section-title">Đổi mật khẩu</h3>
          <form id="security-form" onSubmit={savePw}>
            <div className="form-grid">
              <label className="field span-2"><span>Mật khẩu hiện tại</span><input name="current" type="password" required placeholder="••••••••" /></label>
              <label className="field"><span>Mật khẩu mới</span><input name="next" type="password" required minLength={4} /></label>
              <label className="field"><span>Xác nhận mật khẩu mới</span><input name="confirm" type="password" required minLength={4} /></label>
            </div>
          </form>
        </article>
      ) : null}
      {tab === "roles" ? (
        <div className="profile-stack">
          <article className="card">
            <h3 className="section-title">Vai trò hiện tại</h3>
            <div className="current-role"><RolePill role={current.role} /></div>
          </article>
          <article className="card" style={{ padding: 0 }}>
            <div className="card-head" style={{ padding: "16px 16px 8px" }}><h3 className="section-title">Ma trận quyền hạn</h3></div>
            <div className="table-wrap">
              <table className="perm-table">
                <thead><tr><th>Chức năng</th><th>Quyền của bạn</th></tr></thead>
                <tbody>
                  {permRows.map(([k, l]) => (
                    <tr key={k}>
                      <td>{l}</td>
                      <td>{can(k) ? <span className="badge ok"><I name="check" size={12} /> Được phép</span> : <span className="badge fail"><I name="x" size={12} /> Không có</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}

export function Forbidden() {
  const nav = useNavigate();
  return (
    <div className="forbidden">
      <h2>Bạn không có quyền truy cập</h2>
      <p className="muted" style={{ marginBottom: 20 }}>Tài khoản hiện tại không được mở trang này.</p>
      <button className="btn primary" type="button" onClick={() => nav("/dashboard")}>Quay lại Dashboard</button>
    </div>
  );
}

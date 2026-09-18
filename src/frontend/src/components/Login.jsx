import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { I } from "../lib/icons";
import { useFinance } from "../lib/store";
import { BrandIcon } from "./BrandLogo";

const DEMO_ACCOUNTS = [
  { role: "ADMIN", name: "Admin", email: "admin@demo.local", sub: "Quản trị" },
  { role: "SHOP_OWNER", name: "Chủ shop", email: "owner@demo.local", sub: "Toàn quyền" },
  { role: "EMPLOYEE", name: "Nhân viên", email: "staff@demo.local", sub: "Nhập thu chi" },
  { role: "VIEWER", name: "Người xem", email: "viewer@demo.local", sub: "Chỉ xem" },
];

export default function Login() {
  const { login, toast } = useFinance();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("123456");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    const cleanEmail = email.trim();
    const ok = login(cleanEmail, password, remember);

    if (!ok) {
      setErr("Email hoặc mật khẩu không chính xác.");
      setSubmitting(false);
      return;
    }

    nav("/dashboard");
  }

  function selectDemo(acc) {
    setEmail(acc.email);
    setPassword("123456");
    setErr("");
    toast(`Đã chọn tài khoản: ${acc.name}`);
  }

  return (
    <div className="login-split">
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-logo">
            <BrandIcon size={56} className="brand-icon-lg" />
            <div className="login-brand-copy">
              <span className="login-brand-name">
                <span className="brand-name-mina">Mina</span>
                <span className="brand-name-store">Store</span>
              </span>
              <small>Quản lý tài chính tiệm thủ công</small>
            </div>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <h2>Chào mừng trở lại</h2>
            <p className="lead">Nhập thông tin hoặc chọn tài khoản mẫu để tiếp tục.</p>

            {err && (
              <div className="login-alert-error" role="alert">
                <I name="triangle-alert" size={17} />
                <span>{err}</span>
              </div>
            )}

            <label className="field">
              <span>Email</span>
              <div className="input-ico">
                <span className="input-prefix" aria-hidden="true">
                  <I name="mail" size={17} />
                </span>
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="admin@demo.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label className="field">
              <div className="pw-label">
                <span>Mật khẩu</span>
                <button
                  type="button"
                  className="link"
                  onClick={() => toast("Mật khẩu các tài khoản demo là 123456.")}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="input-ico">
                <span className="input-prefix" aria-hidden="true">
                  <I name="lock" size={17} />
                </span>
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShow((s) => !s)}
                >
                  <I name={show ? "eye-off" : "eye"} size={17} />
                </button>
              </div>
            </label>

            <label className="login-check">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <button
              className="btn primary login-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <I name="log-in" size={18} />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>

            <div className="login-quick-demo">
              <div className="quick-demo-header">
                <span className="quick-demo-title">
                  <I name="users" size={13} /> Tài khoản demo (nhấn để điền)
                </span>
                <span className="quick-demo-pass">Mật khẩu: <code>123456</code></span>
              </div>
              <div className="quick-demo-grid">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      className={`demo-pill ${isSelected ? "active" : ""}`}
                      onClick={() => selectDemo(acc)}
                      title={`${acc.name} - ${acc.email}`}
                    >
                      <span className="demo-pill-title">{acc.name}</span>
                      <span className="demo-pill-sub">{acc.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          <footer className="login-legal">
            <button type="button" className="link" onClick={() => toast("Chính sách điều khoản dịch vụ đang cập nhật.")}>Điều khoản</button>
            <span className="legal-dot">·</span>
            <button type="button" className="link" onClick={() => toast("Hệ thống bảo mật dữ liệu theo tiêu chuẩn.")}>Bảo mật</button>
            <span className="legal-dot">·</span>
            <span className="legal-copy">HandmadeFinance © 2026</span>
          </footer>
        </div>
      </section>

      <aside className="login-hero">
        <div className="login-hero-content">
          <div className="login-hero-badge">
            <span className="hero-badge-dot" />
            Dành cho cửa hàng thủ công
          </div>
          <h2>Tài chính gọn gàng,<br />sáng tạo vững vàng</h2>
          <p>Một không gian quản lý thu chi rõ ràng, nhẹ nhàng và phù hợp với cách bạn vận hành cửa hàng.</p>
          <ul className="login-hero-features">
            <li>
              <span className="hero-check">
                <I name="check" size={12} />
              </span>
              <span>Báo cáo thu chi theo thời gian thực</span>
            </li>
            <li>
              <span className="hero-check">
                <I name="check" size={12} />
              </span>
              <span>Phân quyền vai trò linh hoạt</span>
            </li>
            <li>
              <span className="hero-check">
                <I name="check" size={12} />
              </span>
              <span>Import dữ liệu từ Excel</span>
            </li>
            <li>
              <span className="hero-check">
                <I name="check" size={12} />
              </span>
              <span>Nhật ký hoạt động đầy đủ</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

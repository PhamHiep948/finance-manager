import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { I } from "../lib/icons";
import { useFinance } from "../lib/store";

export default function Login() {
  const { login, toast } = useFinance();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const ok = login(String(fd.get("email") || "").trim(), String(fd.get("password") || ""), Boolean(fd.get("remember")));
    if (!ok) {
      setErr("Email hoặc mật khẩu không đúng.");
      return;
    }
    nav("/dashboard");
  }

  return (
    <div className="login-split">
      <section className="login-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-logo">
            <div className="brand-icon brand-icon-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <span className="login-brand-name">FinanceApp</span>
          </div>
          <h2>Chào mừng trở lại</h2>
          <p className="lead">Nhập thông tin đăng nhập để tiếp tục.</p>
          {err ? <div className="alert-error" role="alert">{err}</div> : null}
          <label className="field">
            <span>Email</span>
            <span className="input-ico">
              <input name="email" type="email" autoComplete="username" required placeholder="admin@demo.local" />
            </span>
          </label>
          <label className="field">
            <span className="pw-label">
              <span>Mật khẩu</span>
              <button type="button" className="link" onClick={() => toast("Liên hệ quản trị viên để đặt lại mật khẩu.")}>Quên mật khẩu?</button>
            </span>
            <span className="input-ico">
              <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required />
              <button type="button" className="pw-toggle" aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShow((s) => !s)}>
                <I name={show ? "eye-off" : "eye"} />
              </button>
            </span>
          </label>
          <label className="check"><input type="checkbox" name="remember" /> Ghi nhớ đăng nhập</label>
          <button className="btn primary login-submit" type="submit">Đăng nhập</button>
          <p className="login-demo">Tài khoản demo: admin@demo.local · owner@demo.local · staff@demo.local · viewer@demo.local<br />Mật khẩu: 123456</p>
        </form>
        <footer className="login-legal">
          <button type="button" className="link">Điều khoản</button>
          <button type="button" className="link">Bảo mật</button>
        </footer>
      </section>
      <aside className="login-hero">
        <div className="login-hero-content">
          <div className="login-hero-badge">Quản lý tài chính</div>
          <h2>Kiểm soát tài chính<br />thông minh hơn</h2>
          <p>Theo dõi thu chi, phân tích báo cáo và quản lý dòng tiền cửa hàng của bạn một cách hiệu quả.</p>
          <ul className="login-hero-features">
            <li><span className="hero-check">✓</span> Báo cáo thu chi theo thời gian thực</li>
            <li><span className="hero-check">✓</span> Phân quyền vai trò linh hoạt</li>
            <li><span className="hero-check">✓</span> Import dữ liệu từ Excel</li>
            <li><span className="hero-check">✓</span> Nhật ký hoạt động đầy đủ</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

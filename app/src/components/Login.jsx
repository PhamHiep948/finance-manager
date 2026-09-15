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
          <h2>Đăng nhập</h2>
          <p className="lead">Nhập email và mật khẩu được cấp cho cửa hàng.</p>
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
    </div>
  );
}

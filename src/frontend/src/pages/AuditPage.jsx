import { useMemo, useState } from "react";
import { I } from "../lib/icons";
import { initials, roleUi } from "../lib/format";
import { UI_AUDIT, UI_MOCK } from "../lib/ui-mock";
import { useFinance } from "../lib/store";
import { Kpi } from "./Dashboard";

const ACT = {
  login: ["neutral", "Đăng nhập"],
  create: ["ok", "Tạo mới"],
  update: ["info", "Cập nhật"],
  import: ["warn", "Nhập file"],
  delete: ["fail", "Xóa"],
  export: ["ok", "Xuất file"],
};

export default function AuditPage() {
  const { audits, users, userName, toast } = useFinance();
  const [q, setQ] = useState("");
  const live = audits.map((a) => ({
    id: "LOG-" + String(a.id).padStart(3, "0"),
    user: userName(a.userId),
    role: roleUi(users.find((u) => u.id === a.userId)?.role),
    action: a.action.includes("Import") ? "import" : a.action.includes("Xóa") ? "delete" : a.action.includes("Sửa") ? "update" : "create",
    module: a.target,
    detail: a.detail,
    time: a.time.replace(" ", "\n"),
  }));
  const rows = useMemo(() => {
    const all = [...live, ...UI_AUDIT];
    const qq = q.toLowerCase();
    return all.filter((a) => !qq || `${a.action}${a.detail}${a.user}`.toLowerCase().includes(qq));
  }, [live, q]);

  return (
    <>
      <div className="kpis">{UI_MOCK.auditKpis.map((k) => <Kpi key={k.label} {...k} />)}</div>
      <div className="toolbar">
        <label className="search-box toolbar-search"><I name="search" /><input type="search" placeholder="Tìm kiếm hành động hoặc người dùng..." value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="toolbar-action-btns">
          <button className="btn ghost" type="button"><I name="download" /> Xuất Log (Excel)</button>
          <button className="btn primary" type="button" onClick={() => toast("Đã làm mới nhật ký")}><I name="refresh-cw" /> Làm mới</button>
        </div>
      </div>
      <article className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="audit-table">
            <thead><tr><th>ID</th><th>Người thực hiện</th><th>Hành động</th><th>Phân mục</th><th>Mô tả chi tiết</th><th>Thời gian</th></tr></thead>
            <tbody>
              {rows.map((a) => {
                const m = ACT[a.action] || ["info", a.action, "info"];
                return (
                  <tr key={a.id}>
                    <td><span className="cell-code">{a.id}</span></td>
                    <td><div className="user-cell"><span className="avatar audit-avatar">{initials(a.user)}</span><div className="meta"><b>{a.user}</b><small>{a.role || ""}</small></div></div></td>
                    <td><span className={`audit-action ${m[0]}`}>{m[1]}</span></td>
                    <td>{a.module}</td>
                    <td>{a.detail}</td>
                    <td><span className="audit-time">{a.time.replace(" ", "\n")}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

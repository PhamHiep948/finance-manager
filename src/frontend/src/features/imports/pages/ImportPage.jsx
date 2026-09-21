import { Fragment, useEffect, useState } from "react";
import { I } from "../../../lib/icons";
import { IMG_IMPORT } from "../../../lib/ui-mock";
import { useFinance } from "../../../lib/store";
import { useImports } from "../hooks/useImports";
import { createImport, previewImport } from "../services/importService";

const isExcel = (name) => /\.xlsx$/i.test(name || "");
const fmtTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function ImportPage() {
  const { toast, reload } = useFinance();
  const history = useImports();
  const [tab, setTab] = useState("flow");
  const [type, setType] = useState("INCOME");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState(false);
  const step = imported ? 3 : preview ? 2 : 1;

  // Xem trước lại mỗi khi đổi tệp hoặc loại dữ liệu.
  useEffect(() => {
    if (!file) return undefined;
    let cancelled = false;
    setPreview(null);
    previewImport(type, file)
      .then((res) => !cancelled && setPreview(res))
      .catch((e) => !cancelled && setStatus(e.message));
    return () => {
      cancelled = true;
    };
  }, [file, type]);

  function onFile(e) {
    const f = e.target.files?.[0];
    setPreview(null);
    setImported(false);
    setStatus("");
    if (!f) { setFile(null); return; }
    if (!isExcel(f.name)) {
      e.target.value = "";
      setFile(null);
      setStatus("Chỉ nhận tệp .xlsx.");
      toast("File không phải Excel");
      return;
    }
    setFile(f);
  }

  async function doImport() {
    if (!file) { setStatus("Hãy chọn file Excel."); return; }
    setBusy(true);
    setStatus("");
    try {
      const batch = await createImport(type, file);
      setImported(true);
      toast(`Đã import ${batch.successRows}/${batch.totalRows} dòng`);
      history.refresh();
      reload();
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="seg-tabs import-tabs-bar">
        <div className="seg-tabs-items">
          <button className={`tab ${tab === "flow" ? "on" : ""}`} type="button" onClick={() => setTab("flow")}>Quy trình Import</button>
          <button className={`tab ${tab === "hist" ? "on" : ""}`} type="button" onClick={() => setTab("hist")}>Lịch sử thực hiện</button>
        </div>
        <div className="toolbar-action-btns">
          <a className="btn ghost" href={type === "EXPENSE" ? "/samples/mau-khoan-chi.xlsx" : "/samples/mau-khoan-thu.xlsx"} download><I name="download" /> Tải file mẫu (.xlsx)</a>
          <button className="btn ghost" type="button"><I name="circle-help" /> Hướng dẫn</button>
        </div>
      </div>
      {tab === "flow" ? (
        <>
          <div className="steps" role="list">
            {[
              { n: 1, label: "Tải tệp lên" },
              { n: 2, label: "Xác thực dữ liệu" },
              { n: 3, label: "Hoàn tất" },
            ].map((it, i) => (
              <Fragment key={it.n}>
                {i > 0 ? <div className={`steps-line${step > i ? " done" : ""}`} /> : null}
                <div className={`step${step === it.n ? " on" : ""}${step > it.n ? " done" : ""}`} role="listitem">
                  <span className="step-dot">{step > it.n ? <I name="check" /> : it.n}</span>
                  <span className="step-label">{it.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="grid-30-70">
            <article className="card">
              <img className="cover-img" src={IMG_IMPORT} alt="" />
              <h3 className="section-title">Mẹo Import dữ liệu</h3>
              <ul className="tip-list">
                <li><I name="circle-check" /> Sử dụng tệp mẫu được cung cấp để đảm bảo cấu trúc cột chính xác.</li>
                <li><I name="circle-check" /> Đảm bảo các cột ngày tháng và số tiền ở đúng định dạng.</li>
                <li><I name="circle-check" /> Dữ liệu trùng lặp sẽ được hệ thống cảnh báo trước khi lưu.</li>
              </ul>
            </article>
            <article className="card">
              <h3 className="section-title">Tải tệp dữ liệu</h3>
              <p className="muted" style={{ marginBottom: 12 }}>Chọn tệp Excel chứa dữ liệu thu chi.</p>
              <div className="radio-row" style={{ marginBottom: 12 }}>
                <label className="choice"><input type="radio" name="itype" value="INCOME" checked={type === "INCOME"} onChange={() => setType("INCOME")} /> Khoản thu</label>
                <label className="choice"><input type="radio" name="itype" value="EXPENSE" checked={type === "EXPENSE"} onChange={() => setType("EXPENSE")} /> Khoản chi</label>
              </div>
              <label className="dropzone">
                <input type="file" accept=".xlsx" onChange={onFile} />
                <span className="kpi-ico blue" style={{ position: "static" }}><I name="upload" /></span>
                <b>Nhấn để tải lên hoặc kéo thả</b>
                <small>Hỗ trợ .xlsx. Dung lượng tối đa 10MB.</small>
                <span className="btn ghost" style={{ pointerEvents: "none" }}><I name="folder-open" /> Chọn tệp từ máy tính</span>
                <span className="muted">{file ? `${file.name} · ${file.size} bytes` : "Chưa chọn tệp"}</span>
              </label>
              <button className="btn primary" type="button" style={{ marginTop: 16 }} onClick={doImport} disabled={busy || !preview || imported}>{busy ? "Đang import..." : "Bắt đầu Import"}</button>
              {status ? <div className="alert-error" style={{ marginTop: 12 }}>{status}</div> : null}
            </article>
          </div>
          {preview ? (
            <article className="card">
              <div className="card-head"><h3 className="section-title">Kết quả xác thực · {preview.originalFileName}</h3></div>
              <div className="kpis">
                <div className="card kpi"><div className="label">Tổng số dòng</div><div className="value num">{preview.totalRows}</div></div>
                <div className="card kpi"><div className="label">Hợp lệ</div><div className="value num">{preview.validRows}</div></div>
                <div className="card kpi"><div className="label">Không hợp lệ</div><div className="value num">{preview.invalidRows}</div></div>
              </div>
              {preview.rows?.length ? (
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table>
                    <thead><tr><th>Dòng</th><th>Ngày</th><th>Nội dung</th><th>Danh mục</th><th className="amount">Số tiền</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                      {preview.rows.map((r) => (
                        <tr key={r.rowNumber}>
                          <td>{r.rowNumber}</td>
                          <td>{r.date || "—"}</td>
                          <td>{r.description || "—"}</td>
                          <td>{r.category || "—"}</td>
                          <td className="amount">{r.amount ?? "—"}</td>
                          <td>
                            <span className={`badge ${r.status === "VALID" ? "ok" : "fail"}`}>{r.status === "VALID" ? "Hợp lệ" : "Lỗi"}</span>
                            {r.errors?.length ? <small className="muted" style={{ display: "block" }}>{r.errors.join(" ")}</small> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </article>
          ) : null}
        </>
      ) : (
        <article className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tệp</th><th>Loại</th><th>Thời gian</th><th className="amount">Dòng thành công</th><th>Kết quả</th></tr></thead>
              <tbody>
                {history.error ? <tr><td colSpan={5}><div className="alert-error">{history.error}</div></td></tr> : null}
                {history.loading && history.items.length === 0 ? <tr><td colSpan={5}><div className="empty">Đang tải...</div></td></tr> : null}
                {!history.loading && !history.error && history.items.length === 0 ? <tr><td colSpan={5}><div className="empty">Chưa có lần import nào.</div></td></tr> : null}
                {history.items.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.originalFileName}</b></td>
                    <td>{b.importType === "INCOME" ? "Khoản thu" : "Khoản chi"}</td>
                    <td>{fmtTime(b.createdAt)}</td>
                    <td className="amount">{b.successRows}/{b.totalRows}</td>
                    <td><span className={`badge ${b.status === "COMPLETED" ? "ok" : "fail"}`}>{b.status === "COMPLETED" ? "Hoàn thành" : "Thất bại"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </>
  );
}

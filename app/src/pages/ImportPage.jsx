import { Fragment, useState } from "react";
import { I } from "../lib/icons";
import { isExcelName } from "../lib/format";
import { IMG_IMPORT } from "../lib/ui-mock";
import { useFinance } from "../lib/store";

export default function ImportPage() {
  const { imports, mockImport, toast } = useFinance();
  const [tab, setTab] = useState("flow");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState(false);
  const step = imported ? 3 : preview ? 2 : 1;

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) { setFile(null); setPreview(false); setImported(false); return; }
    if (!isExcelName(f.name)) {
      e.target.value = "";
      setFile(null);
      setPreview(false);
      setImported(false);
      setStatus("Chỉ nhận .xlsx, .xls hoặc .csv.");
      toast("File không phải Excel");
      return;
    }
    setFile(f);
    setPreview(true);
    setImported(false);
    setStatus("");
  }

  function doImport(e) {
    const type = e.target.closest("article").querySelector("input[name=itype]:checked")?.value || "INCOME";
    if (!file) { setStatus("Hãy chọn file Excel."); return; }
    setBusy(true);
    setTimeout(() => {
      mockImport(file, type);
      setImported(true);
      setBusy(false);
    }, 900);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Import Dữ liệu Excel</h1>
          <p className="page-sub">Tải lên các tệp tài chính của bạn để cập nhật hệ thống nhanh chóng.</p>
        </div>
        <div className="head-actions">
          <a className="btn ghost" href="/samples/mau-khoan-thu.xlsx" download><I name="download" /> Tải file mẫu (.xlsx)</a>
          <button className="btn ghost" type="button"><I name="circle-help" /> Hướng dẫn</button>
        </div>
      </div>
      <div className="seg-tabs">
        <button className={`tab ${tab === "flow" ? "on" : ""}`} type="button" onClick={() => setTab("flow")}>Quy trình Import</button>
        <button className={`tab ${tab === "hist" ? "on" : ""}`} type="button" onClick={() => setTab("hist")}>Lịch sử thực hiện</button>
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
                <label className="choice"><input type="radio" name="itype" value="INCOME" defaultChecked /> Khoản thu</label>
                <label className="choice"><input type="radio" name="itype" value="EXPENSE" /> Khoản chi</label>
              </div>
              <label className="dropzone">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} />
                <span className="kpi-ico blue" style={{ position: "static" }}><I name="upload" /></span>
                <b>Nhấn để tải lên hoặc kéo thả</b>
                <small>Hỗ trợ .xlsx, .xls hoặc .csv. Dung lượng tối đa 10MB.</small>
                <span className="btn ghost" style={{ pointerEvents: "none" }}><I name="folder-open" /> Chọn tệp từ máy tính</span>
                <span className="muted">{file ? `${file.name} · ${file.size} bytes` : "Chưa chọn tệp"}</span>
              </label>
              <button className="btn primary" type="button" style={{ marginTop: 16 }} onClick={doImport} disabled={busy}>{busy ? "Đang import (mock)..." : "Bắt đầu Import"}</button>
              {status ? <div className="alert-error" style={{ marginTop: 12 }}>{status}</div> : null}
            </article>
          </div>
          {preview ? (
            <article className="card">
              <div className="card-head"><h3 className="section-title">Xem trước dữ liệu (mock)</h3></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>STT</th><th>Ngày</th><th>Nội dung</th><th>Mã đơn</th><th className="amount">Order total</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    <tr><td>1</td><td>13/09/2026</td><td>Lily Flower</td><td>4154185113</td><td className="amount plus">22.10</td><td><span className="badge ok">Hợp lệ</span></td></tr>
                    <tr><td>2</td><td>10/09/2026</td><td>Dòng mẫu 2</td><td>—</td><td className="amount plus">120.00</td><td><span className="badge ok">Hợp lệ</span></td></tr>
                  </tbody>
                </table>
              </div>
            </article>
          ) : null}
        </>
      ) : (
        <article className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tệp</th><th>Loại</th><th>Thời gian</th><th>Kết quả</th></tr></thead>
              <tbody>
                {imports.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.fileName}</b></td>
                    <td>{b.type === "INCOME" ? "Khoản thu" : "Khoản chi"}</td>
                    <td>{b.createdAt}</td>
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

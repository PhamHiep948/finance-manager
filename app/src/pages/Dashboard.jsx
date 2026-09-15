import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { useNavigate } from "react-router-dom";
import { I } from "../lib/icons";
import { useFinance } from "../lib/store";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/data";
import { catName, dmy, groupByCat, inRange, money, monthlyFrom, sum } from "../lib/format";
import { CHART_EXPENSE, CHART_INCOME, CHART_PALETTE } from "../lib/theme";

function Kpi({ label, value, delta, up }) {
  const deltaCls = String(delta || "").startsWith("-") || up === false ? "down" : "up";
  return (
    <article className="card kpi">
      <div className="label">{label}</div>
      <div className="value num">{value}</div>
      {delta ? <div className={`chg ${deltaCls}`}>{delta}</div> : null}
    </article>
  );
}

export default function Dashboard() {
  const { incomes, expenses, ccy, setCcy, can } = useFinance();
  const nav = useNavigate();
  const [dashFrom, setDashFrom] = useState("2026-07-01");
  const [dashTo, setDashTo] = useState("2026-09-30");
  const canvas = useRef(null);

  const inc = incomes.filter((x) => inRange(x.incomeDate, dashFrom, dashTo));
  const exp = expenses.filter((x) => inRange(x.expenseDate, dashFrom, dashTo));
  const tin = sum(inc);
  const tex = sum(exp);
  const profit = tin - tex;
  const expenseRatio = tin ? (tex / tin) * 100 : 0;
  const averageIncome = inc.length ? tin / inc.length : 0;
  const averageExpense = exp.length ? tex / exp.length : 0;
  const cats = groupByCat(inc, INCOME_CATEGORIES);
  const colors = CHART_PALETTE;
  const recent = [
    ...inc.map((r) => ({ ...r, kind: "in", date: r.incomeDate })),
    ...exp.map((r) => ({ ...r, kind: "out", date: r.expenseDate })),
  ]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);
  const monthly = monthlyFrom(inc, exp);

  useEffect(() => {
    if (!canvas.current) return;
    const unit = ccy === "EUR" ? "€" : "$";
    const chart = new Chart(canvas.current, {
      type: "line",
      data: {
        labels: monthly.length ? monthly.map((x) => x.m) : ["Không có dữ liệu"],
        datasets: [
          { label: "Thu", data: monthly.map((x) => (ccy === "EUR" ? x.income * 0.92 : x.income)), borderColor: CHART_INCOME, backgroundColor: "rgba(0,113,227,0.10)", fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: CHART_INCOME, borderWidth: 2 },
          { label: "Chi", data: monthly.map((x) => (ccy === "EUR" ? x.expense * 0.92 : x.expense)), borderColor: CHART_EXPENSE, backgroundColor: "transparent", fill: false, tension: 0.35, pointRadius: 3, pointBackgroundColor: CHART_EXPENSE, borderWidth: 2 },
        ],
      },
      options: {
        animation: { duration: 400 },
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#EEF1F4" }, ticks: { font: { size: 10 }, callback: (v) => unit + v } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
        maintainAspectRatio: false,
      },
    });
    return () => chart.destroy();
  }, [ccy, dashFrom, dashTo, tin, tex]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tổng quan</h1>
        </div>
        <div className="head-actions">
          {can("reportRead") ? <button className="btn primary" type="button" onClick={() => nav("/reports")}><I name="bar-chart-3" /> Báo cáo</button> : null}
          {can("incomeCreate") ? <button className="btn secondary" type="button" onClick={() => nav("/incomes?new=1")}><I name="plus" /> Thêm giao dịch</button> : null}
        </div>
      </div>
      <div className="kpis">
        <Kpi label={`Tổng doanh thu (${ccy})`} value={money(tin, ccy)} />
        <Kpi label={`Tổng chi phí (${ccy})`} value={money(tex, ccy)} />
        <Kpi label={`Lợi nhuận ròng (${ccy})`} value={money(profit, ccy)} />
        <Kpi label="Số giao dịch" value={String(inc.length + exp.length)} />
      </div>
      <div className="kpis dashboard-insights">
        <Kpi label={`Chi phí TB / khoản chi (${ccy})`} value={money(averageExpense, ccy)} />
        <Kpi label="Tỷ lệ chi phí / doanh thu" value={`${expenseRatio.toFixed(1)}%`} />
        <Kpi label={`Doanh thu TB / khoản thu (${ccy})`} value={money(averageIncome, ccy)} />
      </div>
      <div className="grid-70-30">
        <article className="card">
          <div className="card-head">
            <div><h3 className="section-title">Biểu đồ Thu chi</h3><p className="muted">Chọn khoảng ngày và loại tiền để xem sơ đồ</p></div>
            <div className="head-actions dash-chart-tools">
              <input className="toolbar-ctrl" type="date" value={dashFrom} title="Từ ngày" onChange={(e) => setDashFrom(e.target.value)} />
              <input className="toolbar-ctrl" type="date" value={dashTo} title="Đến ngày" onChange={(e) => setDashTo(e.target.value)} />
              <select className="toolbar-ctrl" title="Đổi tiền" value={ccy} onChange={(e) => setCcy(e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
          <div className="chart-wrap"><canvas ref={canvas} /></div>
        </article>
        <article className="card">
          <h3 className="section-title">Doanh thu theo Nhóm</h3>
          <p className="muted" style={{ marginBottom: 12 }}>Tỉ lệ theo loại thu · {ccy}</p>
          <div className="hbar">
            {cats.length ? cats.map((g, i) => (
              <div className="hbar-row" key={g.name}>
                <span>{g.name}</span>
                <div className="hbar-track"><div className="hbar-fill" style={{ width: `${g.pct}%`, background: colors[i % colors.length] }} /></div>
                <b className="hbar-pct num">{g.pct.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}%</b>
              </div>
            )) : <div className="empty">Chưa có khoản thu trong kỳ.</div>}
          </div>
          <div className="group-legend">
            {cats.map((g, i) => (
              <div key={g.name}><span><i className="swatch" style={{ background: colors[i % colors.length] }} />{g.name}</span><b className="num">{money(g.amount, ccy)}</b></div>
            ))}
          </div>
        </article>
      </div>
      <article className="card" style={{ padding: 0 }}>
        <div className="card-head" style={{ padding: "14px 16px 0" }}>
          <div><h3 className="section-title">Giao dịch gần đây</h3><p className="muted">Trong kỳ đã chọn · {ccy}</p></div>
          <button className="link" type="button" onClick={() => nav("/incomes")}>Xem tất cả</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ngày</th><th>Nội dung</th><th>Loại</th><th className="amount">Số tiền</th></tr></thead>
            <tbody>
              {recent.length ? recent.map((t) => (
                <tr key={`${t.kind}-${t.id}`}>
                  <td className="muted">{dmy(t.date)}</td>
                  <td>{t.description}</td>
                  <td>{t.kind === "in" ? "Thu" : "Chi"}</td>
                  <td className="amount">{t.kind === "in" ? "+" : "−"} {money(t.amount, ccy)}</td>
                </tr>
              )) : <tr><td colSpan={4}><div className="empty">Không có giao dịch trong khoảng ngày.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

export { Kpi };
export function catLabel(kind, id) {
  return catName(kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES, id);
}

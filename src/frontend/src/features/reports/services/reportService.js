import { api, apiBlob } from "../../../lib/api";

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

/**
 * GET /reports
 * @returns {Promise<{currencyCode: string, totalIncome: number, totalExpense: number,
 *          netResult: number, points: Array}>}
 */
export const getReport = ({ dateFrom, dateTo } = {}) => api(`/reports${qs({ dateFrom, dateTo })}`);

/** GET /reports/export — tải file PDF hoặc XLSX về máy. */
export async function downloadReport({ format, dateFrom, dateTo }) {
  const { blob, filename } = await apiBlob(`/reports/export${qs({ format, dateFrom, dateTo })}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `financial-report.${format.toLowerCase()}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

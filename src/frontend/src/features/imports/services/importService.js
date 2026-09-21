import { api } from "../../../lib/api";

function form(importType, file) {
  const fd = new FormData();
  fd.append("importType", importType);
  fd.append("file", file);
  return fd;
}

/**
 * POST /imports/preview
 * @returns {Promise<{importType: string, originalFileName: string, totalRows: number,
 *          validRows: number, invalidRows: number, rows: Array}>}
 */
export const previewImport = (importType, file) =>
  api("/imports/preview", { method: "POST", body: form(importType, file) });

/** POST /imports — trả về lô import vừa tạo. */
export const createImport = (importType, file) =>
  api("/imports", { method: "POST", body: form(importType, file) });

/**
 * GET /imports
 * @returns {Promise<{items: Array<{id: number, importType: string, originalFileName: string,
 *          status: string, totalRows: number, successRows: number, failedRows: number,
 *          importedBy: number, createdAt: string, completedAt: string|null}>, meta: object}>}
 */
export const listImports = ({ page = 1, pageSize = 20 } = {}) =>
  api(`/imports?page=${page}&pageSize=${pageSize}`);

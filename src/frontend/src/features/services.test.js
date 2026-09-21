import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAccessToken } from "../lib/api";
import { listAuditLogs } from "./audit/services/auditService";
import { createImport, listImports, previewImport } from "./imports/services/importService";
import { downloadReport, getReport } from "./reports/services/reportService";
import { getDashboard } from "./dashboard/services/dashboardService";

const json = (body, init = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" }, ...init });

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn(async () => json({ items: [], meta: {} }));
  vi.stubGlobal("fetch", fetchMock);
  setAccessToken("t");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const url = () => fetchMock.mock.calls.at(-1)[0];
const init = () => fetchMock.mock.calls.at(-1)[1];

describe("auditService", () => {
  it("gửi trang mặc định khi không có bộ lọc", async () => {
    await listAuditLogs();
    expect(url()).toBe("/api/v1/audit-logs?page=1&pageSize=20");
  });

  it("chỉ gửi các bộ lọc có giá trị", async () => {
    await listAuditLogs({ page: 2, pageSize: 50, action: "INSERT", dateFrom: "2026-09-01", dateTo: "", module: undefined });
    const q = new URL(url(), "http://x").searchParams;
    expect(Object.fromEntries(q)).toEqual({ page: "2", pageSize: "50", action: "INSERT", dateFrom: "2026-09-01" });
  });
});

describe("importService", () => {
  const file = new File(["x"], "in.xlsx");

  it("previewImport gửi FormData gồm importType và file", async () => {
    await previewImport("EXPENSE", file);
    expect(url()).toBe("/api/v1/imports/preview");
    expect(init().method).toBe("POST");
    expect(init().body.get("importType")).toBe("EXPENSE");
    expect(init().body.get("file").name).toBe("in.xlsx");
  });

  it("createImport gọi POST /imports", async () => {
    await createImport("INCOME", file);
    expect(url()).toBe("/api/v1/imports");
    expect(init().body.get("importType")).toBe("INCOME");
  });

  it("listImports phân trang", async () => {
    await listImports({ page: 3, pageSize: 10 });
    expect(url()).toBe("/api/v1/imports?page=3&pageSize=10");
  });
});

describe("reportService", () => {
  it("getReport bỏ tham số rỗng", async () => {
    await getReport({ dateFrom: "2026-09-01" });
    expect(url()).toBe("/api/v1/reports?dateFrom=2026-09-01");
    await getReport();
    expect(url()).toBe("/api/v1/reports");
  });

  it("downloadReport tải file bằng thẻ <a> rồi giải phóng URL", async () => {
    fetchMock.mockResolvedValue(
      new Response("bin", { headers: { "Content-Disposition": "attachment; filename=financial-report.pdf" } }),
    );
    const create = vi.fn(() => "blob:fake");
    const revoke = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    let downloaded;
    const original = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => {
      downloaded = el.download;
      return original(el);
    });

    await downloadReport({ format: "PDF", dateFrom: "2026-09-01", dateTo: "2026-09-30" });

    expect(url()).toBe("/api/v1/reports/export?format=PDF&dateFrom=2026-09-01&dateTo=2026-09-30");
    expect(click).toHaveBeenCalledTimes(1);
    expect(downloaded).toBe("financial-report.pdf");
    expect(revoke).toHaveBeenCalledWith("blob:fake");
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("downloadReport đặt tên mặc định khi server không gửi tên", async () => {
    fetchMock.mockResolvedValue(new Response("bin"));
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    let name;
    const original = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => {
      name = el.download;
      return original(el);
    });
    await downloadReport({ format: "XLSX" });
    expect(name).toBe("financial-report.xlsx");
  });

  it("downloadReport ném lỗi của server", async () => {
    fetchMock.mockResolvedValue(json({ detail: "Không có quyền" }, { status: 403 }));
    await expect(downloadReport({ format: "PDF" })).rejects.toThrow("Không có quyền");
  });
});

describe("dashboardService", () => {
  it("truyền khoảng ngày", async () => {
    await getDashboard({ dateFrom: "2026-09-01", dateTo: "2026-09-30" });
    expect(url()).toBe("/api/v1/dashboard?dateFrom=2026-09-01&dateTo=2026-09-30");
  });

  it("không có query khi thiếu khoảng ngày", async () => {
    await getDashboard();
    expect(url()).toBe("/api/v1/dashboard");
  });
});

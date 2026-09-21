import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./audit/services/auditService", () => ({ listAuditLogs: vi.fn() }));
vi.mock("./imports/services/importService", () => ({ listImports: vi.fn() }));
vi.mock("./dashboard/services/dashboardService", () => ({ getDashboard: vi.fn() }));

import { useAuditLogs } from "./audit/hooks/useAuditLogs";
import { listAuditLogs } from "./audit/services/auditService";
import { useImports } from "./imports/hooks/useImports";
import { listImports } from "./imports/services/importService";
import { useDashboard } from "./dashboard/hooks/useDashboard";
import { getDashboard } from "./dashboard/services/dashboardService";

const page = (items, totalItems = items.length) => ({
  items,
  meta: { page: 1, pageSize: 20, totalItems, totalPages: Math.ceil(totalItems / 20) },
});

beforeEach(() => vi.clearAllMocks());

describe("useAuditLogs", () => {
  it("tải dữ liệu lần đầu", async () => {
    listAuditLogs.mockResolvedValue(page([{ id: 1 }], 41));
    const { result } = renderHook(() => useAuditLogs({}, 1));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 1 }]);
    expect(result.current.meta.totalPages).toBe(3);
    expect(result.current.error).toBe("");
  });

  it("truyền bộ lọc và trang xuống service", async () => {
    listAuditLogs.mockResolvedValue(page([]));
    renderHook(() => useAuditLogs({ action: "INSERT", dateFrom: "2026-09-01", dateTo: "2026-09-30" }, 2, 10));
    await waitFor(() => expect(listAuditLogs).toHaveBeenCalled());
    expect(listAuditLogs).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      action: "INSERT",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
    });
  });

  it("tải lại khi bộ lọc đổi", async () => {
    listAuditLogs.mockResolvedValue(page([]));
    const { rerender } = renderHook(({ f }) => useAuditLogs(f, 1), { initialProps: { f: { action: "" } } });
    await waitFor(() => expect(listAuditLogs).toHaveBeenCalledTimes(1));
    rerender({ f: { action: "DELETE" } });
    await waitFor(() => expect(listAuditLogs).toHaveBeenCalledTimes(2));
  });

  it("không tải lại khi bộ lọc giữ nguyên giá trị nhưng là object mới", async () => {
    listAuditLogs.mockResolvedValue(page([]));
    const { rerender } = renderHook(({ f }) => useAuditLogs(f, 1), { initialProps: { f: { action: "A" } } });
    await waitFor(() => expect(listAuditLogs).toHaveBeenCalledTimes(1));
    rerender({ f: { action: "A" } });
    expect(listAuditLogs).toHaveBeenCalledTimes(1);
  });

  it("refresh gọi lại API", async () => {
    listAuditLogs.mockResolvedValue(page([]));
    const { result } = renderHook(() => useAuditLogs({}, 1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.refresh());
    await waitFor(() => expect(listAuditLogs).toHaveBeenCalledTimes(2));
  });

  it("hiện lỗi từ server", async () => {
    listAuditLogs.mockRejectedValue(new Error("Không có quyền"));
    const { result } = renderHook(() => useAuditLogs({}, 1));
    await waitFor(() => expect(result.current.error).toBe("Không có quyền"));
    expect(result.current.loading).toBe(false);
  });

  it("bỏ qua kết quả của yêu cầu cũ khi bộ lọc đã đổi", async () => {
    let resolveOld;
    listAuditLogs
      .mockImplementationOnce(() => new Promise((r) => (resolveOld = r)))
      .mockResolvedValueOnce(page([{ id: "new" }]));
    const { result, rerender } = renderHook(({ f }) => useAuditLogs(f, 1), { initialProps: { f: { action: "A" } } });
    rerender({ f: { action: "B" } });
    await waitFor(() => expect(result.current.items).toEqual([{ id: "new" }]));
    await act(async () => resolveOld(page([{ id: "old" }])));
    expect(result.current.items).toEqual([{ id: "new" }]);
  });
});

describe("useImports", () => {
  it("tải lịch sử import", async () => {
    listImports.mockResolvedValue(page([{ id: 1 }, { id: 2 }]));
    const { result } = renderHook(() => useImports());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(2);
    expect(listImports).toHaveBeenCalledWith({ pageSize: 50 });
  });

  it("refresh tải lại", async () => {
    listImports.mockResolvedValue(page([]));
    const { result } = renderHook(() => useImports());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.refresh());
    await waitFor(() => expect(listImports).toHaveBeenCalledTimes(2));
  });

  it("báo lỗi", async () => {
    listImports.mockRejectedValue(new Error("Lỗi mạng"));
    const { result } = renderHook(() => useImports());
    await waitFor(() => expect(result.current.error).toBe("Lỗi mạng"));
  });
});

describe("useDashboard", () => {
  const summary = { totalIncome: 110, totalExpense: 40, netResult: 70, transactionCount: 3 };

  it("trả số liệu tổng hợp", async () => {
    getDashboard.mockResolvedValue(summary);
    const { result } = renderHook(() => useDashboard("2026-09-01", "2026-09-30", 0));
    await waitFor(() => expect(result.current.summary).toEqual(summary));
    expect(getDashboard).toHaveBeenCalledWith({ dateFrom: "2026-09-01", dateTo: "2026-09-30" });
  });

  it("tải lại khi khoảng ngày đổi hoặc dữ liệu (version) đổi", async () => {
    getDashboard.mockResolvedValue(summary);
    const { rerender } = renderHook(({ from, v }) => useDashboard(from, "2026-09-30", v), {
      initialProps: { from: "2026-09-01", v: 0 },
    });
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(1));
    rerender({ from: "2026-09-15", v: 0 });
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2));
    rerender({ from: "2026-09-15", v: 1 });
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(3));
  });

  it("báo lỗi và giữ summary rỗng", async () => {
    getDashboard.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useDashboard("a", "b", 0));
    await waitFor(() => expect(result.current.error).toBe("500"));
    expect(result.current.summary).toBeNull();
  });
});

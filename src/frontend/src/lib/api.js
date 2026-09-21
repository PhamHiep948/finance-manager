const BASE = import.meta.env.VITE_API_URL || "";

let accessToken = null;
let onUnauthorized = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy.", "NETWORK");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && accessToken && onUnauthorized) onUnauthorized();
    const detail = data?.errors ? Object.values(data.errors).flat().join(" ") : data?.detail;
    throw new ApiError(res.status, detail || data?.title || `Lỗi ${res.status}`, data?.errorCode);
  }
  return data;
}

/** Lấy toàn bộ các trang của một danh sách phân trang. */
export async function fetchAllPages(path) {
  const items = [];
  for (let page = 1; ; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await api(`${path}${sep}page=${page}&pageSize=100`);
    items.push(...res.items);
    if (page >= res.totalPages) return items;
  }
}

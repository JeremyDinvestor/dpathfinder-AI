// The ONLY file that talks to the backend. Every page uses the `api` object below.
const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const TOKEN_KEY = "dpf_token";
const USER_KEY = "dpf_user";

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const getUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
export const saveSession = (token, user) => {
  try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* storage unavailable */ }
};
export const clearSession = () => {
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch { /* storage unavailable */ }
};

export const money = (n, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(n || 0);
export const shortDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-");

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the backend is running.", "network_error", 0);
  }

  let json = null;
  try { json = await res.json(); } catch { /* not JSON */ }

  if (!res.ok || !json?.success) {
    if (res.status === 401 && auth && token) {
      clearSession();
      window.dispatchEvent(new Event("dpf-logout")); // AuthContext listens and signs the user out
    }
    throw new ApiError(json?.error?.message || "Something went wrong. Please try again.", json?.error?.code || "error", res.status);
  }
  return json.data;
}

const query = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== "" && v != null) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  register: (b) => request("/api/v1/auth/register", { method: "POST", body: b, auth: false }),
  login: (b) => request("/api/v1/auth/login", { method: "POST", body: b, auth: false }),
  demoChat: (b) => request("/api/v1/demo/chat", { method: "POST", body: b, auth: false }),
  demoReset: () => request("/api/v1/demo/reset", { method: "POST", auth: false }),
  chat: (b) => request("/api/v1/chat", { method: "POST", body: b }),
  customers: (q) => request(`/api/v1/customers${query(q)}`),
  createCustomer: (b) => request("/api/v1/customers", { method: "POST", body: b }),
  orders: (q) => request(`/api/v1/orders${query(q)}`),
  setOrderStatus: (id, status) => request(`/api/v1/orders/${id}/status`, { method: "PATCH", body: { status } }),
  report: (b) => request("/api/v1/reports/business-summary", { method: "POST", body: b || {} }),
  apiKeys: () => request("/api/v1/api-keys"),
  createApiKey: (b) => request("/api/v1/api-keys", { method: "POST", body: b }),
  revokeApiKey: (id) => request(`/api/v1/api-keys/${id}`, { method: "DELETE" }),
  usage: (days) => request(`/api/v1/usage${query({ days })}`),
};

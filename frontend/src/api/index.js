// ═══════════════════════════════════════════════════════════
// API LAYER  (fetch wrapper)
// ═══════════════════════════════════════════════════════════
const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// Reference to AuthContext logout — set by AuthProvider at runtime
export const AuthCtx = {};

const api = {
  async request(method, path, body) {
    const token = localStorage.getItem("jwt");
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 401) {
      AuthCtx.logout?.();
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  },

  get:    (path)       => api.request("GET",    path),
  post:   (path, body) => api.request("POST",   path, body),
  put:    (path, body) => api.request("PUT",    path, body),
  delete: (path)       => api.request("DELETE", path),

  async postForm(path, formData) {
    const token = localStorage.getItem("jwt");
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (res.status === 401) { AuthCtx.logout?.(); return; }
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw err; }
    if (res.status === 204) return null;
    return res.json();
  },
};

export default api;

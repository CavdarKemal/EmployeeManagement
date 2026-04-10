// ═══════════════════════════════════════════════════════════
// API LAYER  (fetch wrapper)
// ═══════════════════════════════════════════════════════════
const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// Reference to AuthContext logout — set by AuthProvider at runtime
export const AuthCtx = {};

const api = {
  async request(method, path, body) {
    const token = localStorage.getItem("jwt");
    const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 401) {
      AuthCtx.logout?.();
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (!err.message) {
        if (res.status === 403) err.message = "Keine Berechtigung für diese Aktion. Bitte neu einloggen, falls sich deine Rolle geändert hat.";
        else err.message = `Fehler ${res.status}`;
      }
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  },

  get:    (path)       => api.request("GET",    path),
  post:   (path, body) => api.request("POST",   path, body),
  put:    (path, body) => api.request("PUT",    path, body),
  delete: (path)       => api.request("DELETE", path),

  async sendForm(method, path, formData) {
    const token = localStorage.getItem("jwt");
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (res.status === 401) { AuthCtx.logout?.(); return; }
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw err; }
    if (res.status === 204) return null;
    return res.json();
  },

  postForm: (path, formData) => api.sendForm("POST", path, formData),
  putForm:  (path, formData) => api.sendForm("PUT",  path, formData),
};

export default api;

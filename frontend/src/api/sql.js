import api from "./index.js";

const BASE = "/admin/sql";

export const sqlApi = {
  executeReadOnly: (query) => api.post(`${BASE}/execute`, { query }),

  openSession:     ()                  => api.post(`${BASE}/sessions`),
  executeSession:  (sessionId, query)  => api.post(`${BASE}/sessions/${sessionId}/execute`, { query }),
  commit:          (sessionId)         => api.post(`${BASE}/sessions/${sessionId}/commit`),
  rollback:        (sessionId)         => api.post(`${BASE}/sessions/${sessionId}/rollback`),

  loadSchema:      ()                  => api.get(`${BASE}/schema`),
  loadHistory:     (limit = 50)        => api.get(`${BASE}/history?limit=${limit}`),
  deleteHistory:   ()                  => api.delete(`${BASE}/history`),
  deleteHistoryEntry: (id)             => api.delete(`${BASE}/history/${id}`),
};

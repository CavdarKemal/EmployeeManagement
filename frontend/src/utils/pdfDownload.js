/**
 * Lädt eine PDF-Datei vom Backend herunter.
 * @param {string} endpoint - z.B. "/reports/employees"
 * @param {string} filename - z.B. "Mitarbeiter-Bericht.pdf"
 */
export async function downloadPdf(endpoint, filename) {
  const token = localStorage.getItem("jwt");
  const res = await fetch(`/api/v1${endpoint}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error("PDF-Download fehlgeschlagen");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

import { useState } from "react";
import api from "../api/index.js";
import Modal from "./Modal.jsx";
import Btn from "./Button.jsx";

function ImportDialog({ title, endpoint, onDone, onClose, toast }) {
  const [file, setFile]       = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult]   = useState(null);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("jwt");
      const res = await fetch(`/api/v1/import/${endpoint}`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!res.ok) throw await res.json().catch(() => ({}));
      const data = await res.json();
      setResult(data);
      if (data.imported > 0) onDone?.();
    } catch (err) {
      toast?.(err?.message || "Import fehlgeschlagen");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} width={500}>
      {!result ? (
        <>
          <p style={{ color: "#94a3b8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", margin: "0 0 14px" }}>
            CSV-Datei mit Semikolon-Trenner (;) hochladen. Die erste Zeile muss die Spaltenüberschriften enthalten
            (wie beim Export).
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files[0] || null)}
            style={{ fontSize: 13, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="ghost" onClick={onClose}>Abbrechen</Btn>
            <Btn onClick={handleImport} disabled={!file || importing}>
              {importing ? "Importieren …" : "Importieren"}
            </Btn>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", fontFamily: "'Sora', sans-serif" }}>{result.imported}</div>
              <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>Importiert</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b", fontFamily: "'Sora', sans-serif" }}>{result.skipped}</div>
              <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>Übersprungen</div>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div style={{
              maxHeight: 150, overflowY: "auto", padding: "10px 12px", background: "#0f172a",
              borderRadius: "8px", border: "1px solid #334155", marginBottom: 16,
            }}>
              {result.errors.map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: "#f59e0b", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                  {e}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={onClose}>Schließen</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

export default ImportDialog;

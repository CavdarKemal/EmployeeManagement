import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { keymap } from "@codemirror/view";
import { sqlApi } from "../api/sql.js";
import { useTheme } from "../context/ThemeContext.jsx";

const DESTRUCTIVE_PATTERN = /^\s*(DROP|TRUNCATE|DELETE\s+FROM\s+\w+\s*(WHERE\s+(true|1\s*=\s*1)\s*)?(;|\s*$))/i;

/**
 * Splittet SQL-Text in einzelne Statements anhand `;`. Respektiert single-quoted
 * Strings (mit `''`-Escape), -- Zeilenkommentare und /* Block-Kommentare *​/.
 * Liefert pro Statement {text, start, end} mit Char-Offsets im Original.
 */
function splitStatements(sql) {
  const segments = [];
  let i = 0, segStart = 0;
  let inSingleQuote = false, inLineComment = false, inBlockComment = false;
  while (i < sql.length) {
    const c = sql[i], n = sql[i + 1];
    if (inLineComment) { if (c === "\n") inLineComment = false; i++; continue; }
    if (inBlockComment) { if (c === "*" && n === "/") { inBlockComment = false; i += 2; continue; } i++; continue; }
    if (inSingleQuote) {
      if (c === "'" && n === "'") { i += 2; continue; }
      if (c === "'") inSingleQuote = false;
      i++; continue;
    }
    if (c === "-" && n === "-") { inLineComment = true; i += 2; continue; }
    if (c === "/" && n === "*") { inBlockComment = true; i += 2; continue; }
    if (c === "'") { inSingleQuote = true; i++; continue; }
    if (c === ";") {
      segments.push({ text: sql.slice(segStart, i), start: segStart, end: i });
      segStart = i + 1;
      i++; continue;
    }
    i++;
  }
  if (segStart < sql.length) {
    const tail = sql.slice(segStart);
    if (tail.trim()) segments.push({ text: tail, start: segStart, end: sql.length });
  }
  return segments;
}

function findStatementAt(sql, cursorPos) {
  const segs = splitStatements(sql);
  if (segs.length === 0) return sql.trim();
  // Cursor liegt in einem Segment, wenn start <= pos <= end. Bei genau auf `;` zählt das vorhergehende.
  for (const s of segs) {
    if (cursorPos >= s.start && cursorPos <= s.end) return s.text.trim();
  }
  return segs[segs.length - 1].text.trim();
}

export default function AdminSqlPage({ toast }) {
  const { t, mode } = useTheme();
  const [editorMode, setEditorMode]   = useState("read");        // "read" | "tx"
  const [sessionId, setSessionId]     = useState(null);
  const [query, setQuery]             = useState("SELECT * FROM employees LIMIT 100;");
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const [busy, setBusy]               = useState(false);
  const [schema, setSchema]           = useState([]);
  const [history, setHistory]         = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedTables, setExpandedTables] = useState({});
  const queryRef = useRef(query);
  queryRef.current = query;
  const viewRef = useRef(null);

  const isTx = editorMode === "tx" && sessionId;
  const codeMirrorTheme = mode === "dark" ? "dark" : "light";

  // CodeMirror-Schema-Format: { tableName: ["col1", "col2", ...] }
  const schemaForCM = useMemo(() => {
    const s = {};
    for (const tbl of schema) s[tbl.name] = tbl.columns.map((c) => c.name);
    return s;
  }, [schema]);

  // Ref auf den aktuellen run-Closure — die Keymap wird einmal aufgesetzt,
  // muss aber den aktuellen isTx/sessionId-Stand lesen.
  const runQueryRef = useRef(null);

  // Extensions neu erzeugen, wenn das Schema sich ändert. CodeMirror reconfiguriert
  // den Editor live, ohne State zu verlieren. Ctrl+Enter ist als Editor-Keymap
  // gebunden — so kommt der Cursor garantiert frisch aus dem View.
  const cmExtensions = useMemo(
    () => [
      sql({ dialect: PostgreSQL, schema: schemaForCM, upperCaseKeywords: true }),
      keymap.of([
        {
          key: "Ctrl-Enter",
          mac: "Cmd-Enter",
          preventDefault: true,
          run: (view) => {
            const cursor = view.state.selection.main.head;
            const text = view.state.doc.toString();
            const q = findStatementAt(text, cursor);
            runQueryRef.current?.(q);
            return true;
          },
        },
      ]),
    ],
    [schemaForCM],
  );

  // ── Schema beim Mounten laden ──
  useEffect(() => {
    sqlApi.loadSchema()
      .then((s) => setSchema(s?.tables ?? []))
      .catch((e) => toast?.(`Schema-Lookup fehlgeschlagen: ${e.message ?? e}`, "error"));
  }, [toast]);

  // ── History laden, sobald aufgeklappt ──
  useEffect(() => {
    if (historyOpen) {
      sqlApi.loadHistory(50).then(setHistory).catch(() => {});
    }
  }, [historyOpen, result]);

  // ── Run ──
  // Variante 1: Direkt mit gegebener Query (vom Keymap aufgerufen).
  const runQuery = useCallback(async (q) => {
    if (!q?.trim()) return;
    if (DESTRUCTIVE_PATTERN.test(q)) {
      const ok = window.confirm(
        "WARNUNG: Diese Query enthält DROP/TRUNCATE oder DELETE ohne WHERE.\n\n" +
        "Wirklich ausführen?\n\n" + q,
      );
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = isTx
        ? await sqlApi.executeSession(sessionId, q)
        : await sqlApi.executeReadOnly(q);
      setResult(res);
    } catch (e) {
      setError(e.message ?? String(e));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, [isTx, sessionId]);

  // Aktuellen Closure für die Keymap verfügbar halten.
  runQueryRef.current = runQuery;

  // Variante 2: Vom Toolbar-Button — extrahiert Statement vor dem Run.
  const run = useCallback(() => {
    const view = viewRef.current;
    const text = view ? view.state.doc.toString() : queryRef.current;
    const cursor = view ? view.state.selection.main.head : text.length;
    runQuery(findStatementAt(text, cursor));
  }, [runQuery]);

  // ── TX-Lifecycle ──
  const beginTx = async () => {
    setBusy(true);
    try {
      const s = await sqlApi.openSession();
      setSessionId(s.sessionId);
      setEditorMode("tx");
      toast?.(`Transaktion offen — Idle-Timeout ${s.idleTimeoutSeconds}s.`, "success");
    } catch (e) {
      toast?.(e.message ?? String(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const commitTx = async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await sqlApi.commit(sessionId);
      setSessionId(null);
      toast?.("Committed.", "success");
    } catch (e) {
      toast?.(e.message ?? String(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const rollbackTx = async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await sqlApi.rollback(sessionId);
      setSessionId(null);
      toast?.("Zurückgerollt — keine Änderungen persistiert.", "success");
    } catch (e) {
      toast?.(e.message ?? String(e), "error");
    } finally {
      setBusy(false);
    }
  };

  // ── History-Delete ──
  const deleteHistoryEntry = async (id) => {
    try {
      await sqlApi.deleteHistoryEntry(id);
      setHistory((h) => h.filter((e) => e.id !== id));
    } catch (e) {
      toast?.(e.message ?? String(e), "error");
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm(`Komplette History (${history.length} Einträge) wirklich löschen?`)) return;
    try {
      await sqlApi.deleteHistory();
      setHistory([]);
      toast?.("History gelöscht.", "success");
    } catch (e) {
      toast?.(e.message ?? String(e), "error");
    }
  };

  // ── CSV-Export ──
  const exportCsv = () => {
    if (!result?.columns?.length || !result?.rows?.length) return;
    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      result.columns.join(";"),
      ...result.rows.map((r) => r.map(escape).join(";")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `query-result-${Date.now()}.csv`,
    });
    document.body.appendChild(a); a.click(); a.remove();
  };

  // ── Schema-Sidebar Toggle ──
  const toggleTable = (name) =>
    setExpandedTables((m) => ({ ...m, [name]: !m[name] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "calc(100vh - 120px)" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <ModeToggle
          editorMode={editorMode} sessionId={sessionId}
          onPickRead={() => setEditorMode("read")}
          onPickTx={() => setEditorMode("tx")}
          t={t}
        />

        <button onClick={run} disabled={busy} style={btnPrimary(busy)}>
          ▶ Ausführen <kbd style={kbdStyle}>Ctrl+Enter</kbd>
        </button>

        {editorMode === "tx" && !sessionId && (
          <button onClick={beginTx} disabled={busy} style={btnNeutral(t)}>BEGIN</button>
        )}
        {sessionId && (
          <>
            <span style={{ ...txBadge, color: "#fbbf24", borderColor: "#f59e0b" }}>
              ● TX offen <code style={{ opacity: 0.7 }}>{sessionId.slice(0, 8)}</code>
            </span>
            <button onClick={commitTx} disabled={busy} style={btnSuccess}>COMMIT</button>
            <button onClick={rollbackTx} disabled={busy} style={btnDanger}>ROLLBACK</button>
          </>
        )}

        <span style={{ marginLeft: "auto", fontSize: 12, color: t.textMuted }}>
          {result && (
            <>
              <strong>{result.queryType}</strong> · {result.execTimeMs} ms
              {result.rowsAffected != null && ` · ${result.rowsAffected} Zeile(n)`}
              {result.truncated && " · gekappt"}
            </>
          )}
        </span>
      </div>

      {/* Hauptbereich: Schema | (Editor + Result) */}
      <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0 }}>
        {/* Schema-Sidebar */}
        <div style={{
          width: 240, flexShrink: 0, background: t.bgCard, border: `1px solid ${t.border}`,
          borderRadius: 12, overflow: "auto", padding: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Schema · {schema.length} Tabellen
          </div>
          {schema.map((tbl) => (
            <div key={tbl.name} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleTable(tbl.name)}
                style={{
                  width: "100%", textAlign: "left", padding: "6px 8px", borderRadius: 6,
                  background: "transparent", border: "none", cursor: "pointer",
                  color: t.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ marginRight: 6, opacity: 0.6 }}>{expandedTables[tbl.name] ? "▼" : "▶"}</span>
                {tbl.name}
                <span style={{ float: "right", fontSize: 11, color: t.textMuted }}>{tbl.columns.length}</span>
              </button>
              {expandedTables[tbl.name] && (
                <div style={{ paddingLeft: 22, paddingTop: 4 }}>
                  {tbl.columns.map((c) => (
                    <div key={c.name} style={{ fontSize: 12, color: t.textMuted, padding: "2px 0" }}>
                      <span style={{ color: t.text }}>{c.name}</span>{" "}
                      <span style={{ opacity: 0.6 }}>· {c.type}{c.nullable ? "" : " ·!"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Editor + Result */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden", minHeight: 160 }}>
            <CodeMirror
              value={query}
              onChange={setQuery}
              theme={codeMirrorTheme}
              extensions={cmExtensions}
              height="200px"
              basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: false }}
              onCreateEditor={(view) => { viewRef.current = view; }}
            />
          </div>

          {/* Result/Error */}
          <div style={{ flex: 1, overflow: "auto", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12 }}>
            {busy && <div style={{ padding: 16, color: t.textMuted }}>Lade …</div>}
            {error && (
              <div style={{ padding: 16, color: "#fca5a5", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                ✗ {error}
              </div>
            )}
            {result && !error && (
              result.columns?.length
                ? <ResultTable result={result} t={t} onExport={exportCsv} />
                : <div style={{ padding: 16, color: t.text }}>{result.message}</div>
            )}
            {!busy && !result && !error && (
              <div style={{ padding: 16, color: t.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                Tipp: <kbd style={kbdStyle}>Ctrl+Enter</kbd> führt die Query an der Cursor-Position aus.<br/>
                Mehrere Queries durch <code>;</code> trennen, Cursor in die gewünschte Query setzen.<br/>
                Im Read-Mode sind nur SELECTs erlaubt; für UPDATE/INSERT/DELETE in den Transaktions-Modus wechseln.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            style={{
              flex: 1, textAlign: "left", padding: "10px 14px", border: "none",
              background: "transparent", color: t.text, cursor: "pointer", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ opacity: 0.6 }}>{historyOpen ? "▼" : "▶"}</span>
            History {historyOpen && `· ${history.length}`}
          </button>
          {historyOpen && history.length > 0 && (
            <button
              onClick={clearAllHistory}
              disabled={busy}
              style={{
                marginRight: 14, padding: "4px 10px", borderRadius: 6,
                background: "transparent", color: "#fca5a5", border: "1px solid #ef4444",
                fontSize: 12, cursor: busy ? "not-allowed" : "pointer",
              }}
              title="Komplette History löschen"
            >Alle löschen</button>
          )}
        </div>
        {historyOpen && (
          <div style={{ maxHeight: 200, overflow: "auto", borderTop: `1px solid ${t.border}` }}>
            {history.length === 0 ? (
              <div style={{ padding: 12, color: t.textMuted, fontSize: 12 }}>Noch keine Queries.</div>
            ) : history.map((h) => (
              <div
                key={h.id}
                style={{
                  padding: "8px 14px", borderBottom: `1px solid ${t.border}`,
                  fontFamily: "monospace", fontSize: 12, color: t.text,
                  display: "flex", gap: 8, alignItems: "flex-start",
                }}
              >
                <div
                  onClick={() => setQuery(h.queryText)}
                  style={{ flex: 1, cursor: "pointer", minWidth: 0 }}
                  title="In Editor übernehmen"
                >
                  <span style={{ color: h.errorMessage ? "#fca5a5" : t.textMuted, marginRight: 8 }}>
                    [{h.queryType}]
                  </span>
                  <span style={{ color: t.textMuted, marginRight: 8 }}>
                    {new Date(h.executedAt).toLocaleString("de-DE")}
                  </span>
                  <span style={{ color: t.textMuted }}>{h.execTimeMs}ms</span>
                  <div style={{ paddingTop: 2, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {h.queryText}
                  </div>
                  {h.errorMessage && (
                    <div style={{ paddingTop: 2, color: "#fca5a5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      ✗ {h.errorMessage}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteHistoryEntry(h.id)}
                  disabled={busy}
                  style={{
                    width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                    background: "transparent", border: "none", color: t.textMuted,
                    cursor: busy ? "not-allowed" : "pointer", fontSize: 14, lineHeight: 1,
                  }}
                  title="Diesen Eintrag löschen"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-Components ────────────────────────────────────────────

function ModeToggle({ editorMode, sessionId, onPickRead, onPickTx, t }) {
  const txDisabled = sessionId; // während aktiver TX nicht zurück
  return (
    <div style={{
      display: "inline-flex", border: `1px solid ${t.border}`, borderRadius: 8,
      overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
    }}>
      <button
        onClick={onPickRead}
        disabled={!!txDisabled}
        style={{
          padding: "8px 12px", border: "none", cursor: txDisabled ? "not-allowed" : "pointer",
          background: editorMode === "read" ? "#6366f1" : "transparent",
          color: editorMode === "read" ? "#fff" : t.text,
          fontSize: 12, fontWeight: 600,
        }}
      >Read</button>
      <button
        onClick={onPickTx}
        style={{
          padding: "8px 12px", border: "none", cursor: "pointer",
          background: editorMode === "tx" ? "#f59e0b" : "transparent",
          color: editorMode === "tx" ? "#fff" : t.text,
          fontSize: 12, fontWeight: 600,
        }}
      >Transaction</button>
    </div>
  );
}

function ResultTable({ result, t, onExport }) {
  return (
    <div>
      <div style={{ display: "flex", padding: "8px 14px", borderBottom: `1px solid ${t.border}`, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: t.textMuted }}>
          {result.rows.length} Zeilen{result.truncated && " (gekappt)"}
        </span>
        <button
          onClick={onExport}
          style={{
            marginLeft: "auto", padding: "4px 10px", borderRadius: 6,
            background: "#1f2937", color: "#fff", border: "1px solid #374151",
            fontSize: 12, cursor: "pointer",
          }}
        >CSV-Export</button>
      </div>
      <div style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 12 }}>
          <thead style={{ position: "sticky", top: 0, background: t.bg }}>
            <tr>
              {result.columns.map((c) => (
                <th key={c} style={{
                  padding: "6px 10px", textAlign: "left", color: t.textMuted,
                  borderBottom: `1px solid ${t.border}`, fontWeight: 600,
                }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: "6px 10px", color: cell == null ? t.textMuted : t.text, whiteSpace: "nowrap" }}>
                    {cell == null ? "NULL" : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Inline-Styles ────────────────────────────────────────────
const btnPrimary = (busy) => ({
  padding: "8px 14px", borderRadius: 8, border: "none",
  background: busy ? "#475569" : "#6366f1", color: "#fff",
  fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
});
const btnNeutral = (t) => ({
  padding: "8px 14px", borderRadius: 8, border: `1px solid ${t.border}`,
  background: "transparent", color: t.text, fontSize: 13, cursor: "pointer", fontWeight: 600,
});
const btnSuccess = {
  padding: "8px 14px", borderRadius: 8, border: "none",
  background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnDanger = {
  padding: "8px 14px", borderRadius: 8, border: "none",
  background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const txBadge = {
  padding: "4px 10px", borderRadius: 6, border: "1px solid",
  fontSize: 12, fontFamily: "monospace",
};
const kbdStyle = {
  padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.15)",
  fontSize: 11, fontFamily: "monospace",
};

import { useState, useMemo } from "react";

/**
 * Hook für sortierbare Listen
 * @param {Array} data - Die zu sortierenden Daten
 * @param {Object} config - { key: string, direction: 'asc' | 'desc' } - Initiale Sortierung
 * @returns {Object} { sortedData, sortConfig, requestSort, SortIcon }
 */
export function useSortable(data, config = { key: null, direction: "asc" }) {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Null/undefined handling
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bVal == null) return sortConfig.direction === "asc" ? -1 : 1;

      // Zahlen
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Datum (ISO-String oder Date)
      if (sortConfig.key.toLowerCase().includes("date") || 
          sortConfig.key.toLowerCase().includes("at")) {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return sortConfig.direction === "asc" 
            ? aDate - bDate 
            : bDate - aDate;
        }
      }

      // Strings (locale-aware)
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr, "de");
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return { sortedData, sortConfig, requestSort };
}

/**
 * Sortier-Icon Komponente
 */
export function SortIcon({ active, direction }) {
  if (!active) {
    return (
      <span style={{ opacity: 0.3, marginLeft: 4, fontSize: 10 }}>⇅</span>
    );
  }
  return (
    <span style={{ marginLeft: 4, fontSize: 10, color: "#6366f1" }}>
      {direction === "asc" ? "▲" : "▼"}
    </span>
  );
}

/**
 * Klickbarer Sortier-Header (für Listen ohne Tabelle)
 */
export function SortButton({ label, sortKey, sortConfig, onSort }) {
  const isActive = sortConfig.key === sortKey;
  
  return (
    <button
      onClick={() => onSort(sortKey)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: "6px",
        border: `1px solid ${isActive ? "#6366f1" : "#334155"}`,
        background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
        color: isActive ? "#a5b4fc" : "#64748b",
        fontSize: 11,
        fontWeight: isActive ? 600 : 400,
        fontFamily: "'DM Sans', sans-serif",
        cursor: "pointer",
        transition: "all 150ms ease",
      }}
      title={`Sortieren nach ${label}`}
    >
      {label}
      <SortIcon active={isActive} direction={sortConfig.direction} />
    </button>
  );
}

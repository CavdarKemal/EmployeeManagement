/**
 * Exportiert ein Array von Objekten als CSV-Datei.
 * @param {Object[]} data - Die Daten
 * @param {Object[]} columns - [{key, label}] — welche Felder in welcher Reihenfolge
 * @param {string} filename - Dateiname ohne Endung
 */
export function exportCSV(data, columns, filename) {
  const separator = ";"; // Semikolon für deutsche Excel-Kompatibilität
  const BOM = "\uFEFF";  // UTF-8 BOM für Umlaute in Excel

  const header = columns.map((c) => `"${c.label}"`).join(separator);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(separator)
  );

  const csv = BOM + [header, ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

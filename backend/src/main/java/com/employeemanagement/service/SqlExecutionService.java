package com.employeemanagement.service;

import com.employeemanagement.dto.SqlExecuteResponse;
import com.employeemanagement.dto.SqlHistoryEntry;
import com.employeemanagement.dto.SqlSchemaResponse;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.model.SqlExecutionLog;
import com.employeemanagement.repository.SqlExecutionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SqlExecutionService {

    private final DataSource dataSource;
    private final SqlExecutionLogRepository logRepo;

    @Value("${app.sql-editor.statement-timeout-seconds:30}")
    private int statementTimeoutSeconds;

    @Value("${app.sql-editor.max-rows:5000}")
    private int maxRows;

    @Value("${app.sql-editor.history-keep-per-user:1000}")
    private int historyKeepPerUser;

    private static final Pattern FIRST_TOKEN = Pattern.compile("^\\s*(\\w+)");
    private static final java.util.Set<String> READ_ONLY_TYPES =
            java.util.Set.of("SELECT", "WITH", "EXPLAIN", "SHOW", "TABLE", "VALUES");

    /**
     * Führt eine Query in einer NEUEN Connection mit Auto-Commit aus.
     * Nur für SELECT-artige Queries (Read-Mode). Schreibende Queries werden hier abgelehnt.
     */
    public SqlExecuteResponse executeReadOnly(String query, String userEmail) {
        String type = detectQueryType(query);
        if (!READ_ONLY_TYPES.contains(type)) {
            throw new BusinessException(
                    "Im Read-Mode sind nur SELECT-artige Queries erlaubt. Erkannter Typ: " + type
                            + ". Wechsle in den Transaktions-Modus für DML/DDL.");
        }
        long startNs = System.nanoTime();
        try (Connection conn = dataSource.getConnection()) {
            return runQuery(conn, query, type, startNs, userEmail, null);
        } catch (SQLException e) {
            int ms = (int) ((System.nanoTime() - startNs) / 1_000_000);
            audit(userEmail, null, type, query, null, ms, e.getMessage());
            throw new BusinessException("SQL-Fehler: " + e.getMessage());
        }
    }

    /**
     * Führt eine Query auf einer pinned Session-Connection aus (Transaktions-Modus).
     * Erlaubt sowohl Read als auch Write.
     */
    public SqlExecuteResponse executeInSession(SqlSessionManager.PinnedSession session, String query) {
        String type = detectQueryType(query);
        long startNs = System.nanoTime();
        try {
            return runQuery(session.connection, query, type, startNs, session.userEmail, session.id);
        } catch (SQLException e) {
            int ms = (int) ((System.nanoTime() - startNs) / 1_000_000);
            audit(session.userEmail, session.id, type, query, null, ms, e.getMessage());
            throw new BusinessException("SQL-Fehler: " + e.getMessage());
        }
    }

    private SqlExecuteResponse runQuery(Connection conn, String query, String type, long startNs,
                                        String userEmail, String sessionId) throws SQLException {
        try (Statement stmt = conn.createStatement()) {
            stmt.setQueryTimeout(statementTimeoutSeconds);

            boolean hasResultSet = stmt.execute(query);
            if (hasResultSet) {
                try (ResultSet rs = stmt.getResultSet()) {
                    return buildSelectResponse(rs, type, startNs, userEmail, sessionId, query);
                }
            } else {
                int affected = stmt.getUpdateCount();
                int ms = (int) ((System.nanoTime() - startNs) / 1_000_000);
                audit(userEmail, sessionId, type, query, affected, ms, null);
                return new SqlExecuteResponse(type, List.of(), List.of(), affected, false, ms,
                        affected + " Zeile(n) betroffen.");
            }
        }
    }

    private SqlExecuteResponse buildSelectResponse(ResultSet rs, String type, long startNs,
                                                   String userEmail, String sessionId, String query)
            throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        int colCount = meta.getColumnCount();
        List<String> columns = new ArrayList<>(colCount);
        for (int i = 1; i <= colCount; i++) columns.add(meta.getColumnLabel(i));

        List<List<Object>> rows = new ArrayList<>();
        boolean truncated = false;
        while (rs.next()) {
            if (rows.size() >= maxRows) {
                truncated = true;
                break;
            }
            List<Object> row = new ArrayList<>(colCount);
            for (int i = 1; i <= colCount; i++) row.add(normalize(rs.getObject(i)));
            rows.add(row);
        }
        int ms = (int) ((System.nanoTime() - startNs) / 1_000_000);
        String msg = truncated
                ? rows.size() + " Zeilen geliefert (auf " + maxRows + " gekappt — Query weiter einschränken)."
                : rows.size() + " Zeilen.";
        audit(userEmail, sessionId, type, query, rows.size(), ms, null);
        return new SqlExecuteResponse(type, columns, rows, null, truncated, ms, msg);
    }

    /** JDBC-Werte JSON-tauglich machen (java.sql.Date/Time → ISO-String etc.). */
    private static Object normalize(Object o) {
        if (o == null) return null;
        if (o instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toString();
        if (o instanceof java.sql.Date d)      return d.toLocalDate().toString();
        if (o instanceof java.sql.Time t)      return t.toLocalTime().toString();
        if (o instanceof byte[] b)             return "<bytea: " + b.length + " Byte>";
        if (o instanceof Clob || o instanceof Blob) return "<lob>";
        return o;
    }

    public SqlSchemaResponse loadSchema() {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement("""
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position
                """);
             ResultSet rs = ps.executeQuery()) {

            java.util.Map<String, List<SqlSchemaResponse.ColumnInfo>> grouped = new java.util.LinkedHashMap<>();
            while (rs.next()) {
                String table = rs.getString("table_name");
                grouped.computeIfAbsent(table, k -> new ArrayList<>())
                        .add(new SqlSchemaResponse.ColumnInfo(
                                rs.getString("column_name"),
                                rs.getString("data_type"),
                                "YES".equalsIgnoreCase(rs.getString("is_nullable"))));
            }
            List<SqlSchemaResponse.TableInfo> tables = new ArrayList<>();
            grouped.forEach((name, cols) -> tables.add(new SqlSchemaResponse.TableInfo(name, cols)));
            return new SqlSchemaResponse(tables);
        } catch (SQLException e) {
            throw new BusinessException("Schema-Lookup fehlgeschlagen: " + e.getMessage());
        }
    }

    public int deleteHistory(String userEmail) {
        return logRepo.deleteByUserEmail(userEmail);
    }

    public boolean deleteHistoryEntry(String userEmail, Long id) {
        return logRepo.deleteByIdAndUserEmail(id, userEmail) > 0;
    }

    public List<SqlHistoryEntry> loadHistory(String userEmail, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 500);
        return logRepo.findByUserEmailOrderByExecutedAtDesc(userEmail, PageRequest.of(0, safeLimit))
                .stream()
                .map(l -> new SqlHistoryEntry(
                        l.getId(),
                        l.getExecutedAt(),
                        l.getQueryType(),
                        l.getQueryText(),
                        l.getRowsAffected(),
                        l.getExecTimeMs(),
                        l.getErrorMessage(),
                        l.getSessionId()))
                .toList();
    }

    void audit(String userEmail, String sessionId, String queryType, String query,
               Integer rowsAffected, int execTimeMs, String errorMessage) {
        try {
            logRepo.save(SqlExecutionLog.builder()
                    .userEmail(userEmail)
                    .sessionId(sessionId)
                    .queryType(queryType == null ? "UNKNOWN" : queryType)
                    .queryText(query)
                    .rowsAffected(rowsAffected)
                    .execTimeMs(execTimeMs)
                    .errorMessage(errorMessage)
                    .build());
            // History pro User auf 'historyKeepPerUser' kappen — nicht bei jeder Query, sondern stochastisch.
            if (Math.random() < 0.05) {
                int trimmed = logRepo.trimHistoryForUser(userEmail, historyKeepPerUser);
                if (trimmed > 0) log.debug("History-Trim für {}: {} Einträge entfernt", userEmail, trimmed);
            }
        } catch (Exception e) {
            log.error("Audit-Log-Schreiben fehlgeschlagen (Query wird trotzdem ausgeführt)", e);
        }
    }

    private static String detectQueryType(String query) {
        var m = FIRST_TOKEN.matcher(query);
        return m.find() ? m.group(1).toUpperCase(java.util.Locale.ROOT) : "UNKNOWN";
    }
}

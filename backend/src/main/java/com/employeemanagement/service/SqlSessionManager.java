package com.employeemanagement.service;

import com.employeemanagement.exception.BusinessException;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Verwaltet pinned DB-Connections für manuelle SQL-Transaktionen pro Admin-User.
 * Eine Session = eine Connection mit autoCommit=false. Liegt sie länger als
 * {@code idleTimeout} brach, rollt der Cleanup-Job sie zurück und gibt die
 * Connection an den Pool zurück.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SqlSessionManager {

    private final DataSource dataSource;

    @Value("${app.sql-editor.session-idle-seconds:300}")
    private int idleTimeoutSeconds;

    private final Map<String, PinnedSession> sessions = new ConcurrentHashMap<>();

    public int getIdleTimeoutSeconds() {
        return idleTimeoutSeconds;
    }

    public PinnedSession open(String userEmail) {
        try {
            Connection conn = dataSource.getConnection();
            conn.setAutoCommit(false);
            String id = UUID.randomUUID().toString();
            PinnedSession session = new PinnedSession(id, userEmail, conn, LocalDateTime.now());
            sessions.put(id, session);
            log.info("SQL-Session geöffnet: {} (user={})", id, userEmail);
            return session;
        } catch (SQLException e) {
            throw new BusinessException("Konnte keine DB-Connection für SQL-Session bekommen: " + e.getMessage());
        }
    }

    public PinnedSession get(String sessionId, String userEmail) {
        PinnedSession s = sessions.get(sessionId);
        if (s == null) {
            throw new BusinessException("SQL-Session existiert nicht oder wurde wegen Inaktivität geschlossen.");
        }
        if (!s.userEmail.equals(userEmail)) {
            throw new BusinessException("SQL-Session gehört einem anderen User.");
        }
        s.touch();
        return s;
    }

    public void commit(String sessionId, String userEmail) {
        PinnedSession s = get(sessionId, userEmail);
        try {
            s.connection.commit();
            log.info("SQL-Session committed: {} (user={})", sessionId, userEmail);
        } catch (SQLException e) {
            throw new BusinessException("COMMIT fehlgeschlagen: " + e.getMessage());
        } finally {
            close(s);
        }
    }

    public void rollback(String sessionId, String userEmail) {
        PinnedSession s = get(sessionId, userEmail);
        try {
            s.connection.rollback();
            log.info("SQL-Session rolled-back: {} (user={})", sessionId, userEmail);
        } catch (SQLException e) {
            log.warn("ROLLBACK in Session {} schlug fehl: {}", sessionId, e.getMessage());
        } finally {
            close(s);
        }
    }

    private void close(PinnedSession s) {
        sessions.remove(s.id);
        try {
            s.connection.close();
        } catch (SQLException e) {
            log.warn("Connection-Close in Session {} schlug fehl: {}", s.id, e.getMessage());
        }
    }

    @Scheduled(fixedDelay = 30_000)
    void cleanupIdleSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minus(Duration.ofSeconds(idleTimeoutSeconds));
        Iterator<Map.Entry<String, PinnedSession>> it = sessions.entrySet().iterator();
        while (it.hasNext()) {
            PinnedSession s = it.next().getValue();
            if (s.lastUsedAt.isBefore(cutoff)) {
                log.warn("SQL-Session {} wegen Idle-Timeout (>{}s) geschlossen — Rollback (user={})",
                        s.id, idleTimeoutSeconds, s.userEmail);
                try {
                    s.connection.rollback();
                } catch (SQLException e) {
                    log.warn("Auto-Rollback in Session {} schlug fehl: {}", s.id, e.getMessage());
                }
                try {
                    s.connection.close();
                } catch (SQLException ignored) {
                }
                it.remove();
            }
        }
    }

    @PreDestroy
    void shutdown() {
        sessions.values().forEach(s -> {
            try { s.connection.rollback(); } catch (SQLException ignored) {}
            try { s.connection.close();    } catch (SQLException ignored) {}
        });
        sessions.clear();
    }

    public static class PinnedSession {
        public final String id;
        public final String userEmail;
        public final Connection connection;
        public final LocalDateTime openedAt;
        private volatile LocalDateTime lastUsedAt;

        PinnedSession(String id, String userEmail, Connection connection, LocalDateTime openedAt) {
            this.id = id;
            this.userEmail = userEmail;
            this.connection = connection;
            this.openedAt = openedAt;
            this.lastUsedAt = openedAt;
        }

        void touch() { this.lastUsedAt = LocalDateTime.now(); }
    }
}

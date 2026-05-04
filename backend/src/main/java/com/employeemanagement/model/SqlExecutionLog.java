package com.employeemanagement.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sql_execution_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SqlExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "executed_at", nullable = false, updatable = false)
    private LocalDateTime executedAt;

    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(name = "session_id", length = 36)
    private String sessionId;

    @Column(name = "query_type", nullable = false, length = 20)
    private String queryType;

    @Column(name = "query_text", nullable = false, columnDefinition = "TEXT")
    private String queryText;

    @Column(name = "rows_affected")
    private Integer rowsAffected;

    @Column(name = "exec_time_ms", nullable = false)
    private int execTimeMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}

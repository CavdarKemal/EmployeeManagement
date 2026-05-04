CREATE TABLE sql_execution_log (
    id              BIGSERIAL PRIMARY KEY,
    executed_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    user_email      VARCHAR(255) NOT NULL,
    session_id      VARCHAR(36),
    query_type      VARCHAR(20)  NOT NULL,
    query_text      TEXT         NOT NULL,
    rows_affected   INTEGER,
    exec_time_ms    INTEGER      NOT NULL,
    error_message   TEXT
);

CREATE INDEX idx_sql_log_user      ON sql_execution_log(user_email);
CREATE INDEX idx_sql_log_executed  ON sql_execution_log(executed_at);

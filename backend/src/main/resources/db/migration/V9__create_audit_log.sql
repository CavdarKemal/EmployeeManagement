CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(255) NOT NULL,
    action      VARCHAR(10)  NOT NULL,
    path        VARCHAR(500) NOT NULL,
    status      INT          NOT NULL,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_username ON audit_log(username);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

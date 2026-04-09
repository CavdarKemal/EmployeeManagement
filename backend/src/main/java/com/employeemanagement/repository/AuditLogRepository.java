package com.employeemanagement.repository;

import com.employeemanagement.model.AuditLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLogEntry, Long> {

    @Query("""
        SELECT a FROM AuditLogEntry a
        WHERE (:search IS NULL OR
               LOWER(a.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR
               LOWER(a.path)     LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        ORDER BY a.createdAt DESC
        """)
    Page<AuditLogEntry> search(@Param("search") String search, Pageable pageable);
}

package com.employeemanagement.repository;

import com.employeemanagement.model.SqlExecutionLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SqlExecutionLogRepository extends JpaRepository<SqlExecutionLog, Long> {

    List<SqlExecutionLog> findByUserEmailOrderByExecutedAtDesc(String userEmail, Pageable pageable);

    long countByUserEmail(String userEmail);

    @Modifying
    @Transactional
    @Query(value = """
        DELETE FROM sql_execution_log
        WHERE user_email = :email
          AND id NOT IN (
              SELECT id FROM sql_execution_log
              WHERE user_email = :email
              ORDER BY executed_at DESC
              LIMIT :keep
          )
        """, nativeQuery = true)
    int trimHistoryForUser(@Param("email") String userEmail, @Param("keep") int keep);
}

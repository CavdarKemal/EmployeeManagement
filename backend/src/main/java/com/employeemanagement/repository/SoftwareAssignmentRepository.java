package com.employeemanagement.repository;

import com.employeemanagement.model.SoftwareAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SoftwareAssignmentRepository extends JpaRepository<SoftwareAssignment, Long> {

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM SoftwareAssignment a
        WHERE a.employee.id = :employeeId
          AND a.software.id = :softwareId
          AND a.revokedDate IS NULL
        """)
    boolean existsActiveAssignment(@Param("employeeId") Long employeeId,
                                   @Param("softwareId") Long softwareId);

    @Query("""
        SELECT a FROM SoftwareAssignment a
        WHERE a.employee.id = :employeeId
          AND a.software.id = :softwareId
          AND a.revokedDate IS NULL
        """)
    Optional<SoftwareAssignment> findActiveAssignment(@Param("employeeId") Long employeeId,
                                                      @Param("softwareId") Long softwareId);
}

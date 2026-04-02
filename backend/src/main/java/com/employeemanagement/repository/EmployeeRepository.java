package com.employeemanagement.repository;

import com.employeemanagement.model.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByEmployeeNumber(String employeeNumber);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.active = true
          AND (:search IS NULL OR
               LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(e.lastName)  LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(e.email)     LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(e.department) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(e.position)   LIKE LOWER(CONCAT('%', :search, '%')) OR
               e.employeeNumber    LIKE CONCAT('%', :search, '%'))
        """)
    Page<Employee> searchActive(@Param("search") String search, Pageable pageable);

    Page<Employee> findAllByDepartment(String department, Pageable pageable);
}

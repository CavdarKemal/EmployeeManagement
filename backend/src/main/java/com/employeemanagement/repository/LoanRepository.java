package com.employeemanagement.repository;

import com.employeemanagement.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    @Query("SELECT l FROM Loan l WHERE l.hardware.id = :hwId AND l.returnedAt IS NULL")
    Optional<Loan> findActiveLoanByHardwareId(@Param("hwId") Long hardwareId);

    @Query("SELECT l FROM Loan l WHERE l.employee.id = :empId AND l.returnedAt IS NULL")
    List<Loan> findActiveByEmployeeId(@Param("empId") Long employeeId);

    @Query("SELECT l FROM Loan l WHERE l.employee.id = :empId ORDER BY l.loanDate DESC")
    List<Loan> findAllByEmployeeId(@Param("empId") Long employeeId);
}

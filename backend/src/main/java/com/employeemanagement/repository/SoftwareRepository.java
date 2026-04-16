package com.employeemanagement.repository;

import com.employeemanagement.model.Software;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SoftwareRepository extends JpaRepository<Software, Long> {
    java.util.Optional<Software> findByName(String name);
}

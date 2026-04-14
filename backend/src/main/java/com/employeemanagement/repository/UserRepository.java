package com.employeemanagement.repository;

import com.employeemanagement.model.AppUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    List<AppUser> findByRoleAndEnabledTrue(AppUser.Role role);

    @Query("""
        SELECT u FROM AppUser u
        WHERE :search IS NULL OR
              LOWER(u.email)       LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR
              LOWER(u.displayName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
        """)
    Page<AppUser> search(@Param("search") String search, Pageable pageable);

    long countByRole(AppUser.Role role);
}

package com.employeemanagement.repository;

import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Hardware.HardwareStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HardwareRepository extends JpaRepository<Hardware, Long> {

    Optional<Hardware> findByAssetTag(String assetTag);
    boolean existsByAssetTag(String assetTag);
    boolean existsBySerialNumber(String serialNumber);

    List<Hardware> findByStatus(HardwareStatus status);

    @Query("""
        SELECT h FROM Hardware h
        WHERE (:search IS NULL OR
               LOWER(h.name)         LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(h.manufacturer) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(h.assetTag)     LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR h.status = :status)
        """)
    Page<Hardware> search(@Param("search") String search,
                          @Param("status") HardwareStatus status,
                          Pageable pageable);

    @Query("SELECT h FROM Hardware h WHERE h.warrantyUntil < :date AND h.status != 'RETIRED'")
    List<Hardware> findWarrantyExpiredBefore(@Param("date") LocalDate date);
}

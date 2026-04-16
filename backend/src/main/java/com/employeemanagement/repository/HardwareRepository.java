package com.employeemanagement.repository;

import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.HardwareUnit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface HardwareRepository extends JpaRepository<Hardware, Long> {

    @Query("""
        SELECT DISTINCT h FROM Hardware h
        WHERE (:search IS NULL OR :search = ''
               OR LOWER(h.name)         LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
               OR LOWER(h.manufacturer) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
               OR LOWER(h.model)        LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
               OR EXISTS (SELECT 1 FROM HardwareUnit u WHERE u.hardware = h
                          AND (LOWER(u.assetTag)     LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                            OR LOWER(u.serialNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))))
          AND (:status IS NULL
               OR EXISTS (SELECT 1 FROM HardwareUnit u WHERE u.hardware = h AND u.status = :status))
        """)
    Page<Hardware> search(@Param("search") String search,
                          @Param("status") HardwareUnit.HardwareUnitStatus status,
                          Pageable pageable);

    @Query("""
        SELECT DISTINCT h FROM Hardware h
        JOIN h.units u
        WHERE u.warrantyUntil < :date AND u.status <> com.employeemanagement.model.HardwareUnit.HardwareUnitStatus.RETIRED
        """)
    List<Hardware> findWithWarrantyExpiredBefore(@Param("date") LocalDate date);
}

package com.employeemanagement.repository;

import com.employeemanagement.model.HardwareUnit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HardwareUnitRepository extends JpaRepository<HardwareUnit, Long> {
    List<HardwareUnit> findByHardwareId(Long hardwareId);
    List<HardwareUnit> findByHardwareIdAndStatus(Long hardwareId, HardwareUnit.HardwareUnitStatus status);
    boolean existsByAssetTag(String assetTag);
    boolean existsBySerialNumber(String serialNumber);
    long countByHardwareId(Long hardwareId);
    long countByHardwareIdAndStatus(Long hardwareId, HardwareUnit.HardwareUnitStatus status);
}

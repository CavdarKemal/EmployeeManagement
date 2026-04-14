package com.employeemanagement.service;

import com.employeemanagement.dto.HardwareUnitDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.HardwareUnitMapper;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.HardwareUnit;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.HardwareUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HardwareUnitService {

    private final HardwareUnitRepository unitRepo;
    private final HardwareRepository hardwareRepo;
    private final HardwareUnitMapper mapper;

    @Transactional(readOnly = true)
    public List<HardwareUnitDTO> findByHardwareId(Long hardwareId) {
        return unitRepo.findByHardwareId(hardwareId).stream().map(mapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<HardwareUnitDTO> findAvailable(Long hardwareId) {
        return unitRepo.findByHardwareIdAndStatus(hardwareId, HardwareUnit.HardwareUnitStatus.AVAILABLE)
                .stream().map(mapper::toDTO).toList();
    }

    public HardwareUnitDTO create(Long hardwareId, HardwareUnitDTO dto) {
        Hardware hw = hardwareRepo.findById(hardwareId)
                .orElseThrow(() -> new ResourceNotFoundException("Hardware", hardwareId));
        assertAssetTagFree(dto.getAssetTag(), null);
        assertSerialFree(dto.getSerialNumber(), null);
        HardwareUnit saved = unitRepo.save(mapper.toEntity(dto, hw));
        log.info("HardwareUnit angelegt: {} (Hardware {})", saved.getAssetTag(), hardwareId);
        return mapper.toDTO(saved);
    }

    public HardwareUnitDTO update(Long unitId, HardwareUnitDTO dto) {
        HardwareUnit existing = unitRepo.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("HardwareUnit", unitId));
        assertAssetTagFree(dto.getAssetTag(), existing);
        assertSerialFree(dto.getSerialNumber(), existing);
        mapper.updateEntity(dto, existing);
        return mapper.toDTO(unitRepo.save(existing));
    }

    public void delete(Long unitId) {
        HardwareUnit u = unitRepo.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("HardwareUnit", unitId));
        if (u.getStatus() == HardwareUnit.HardwareUnitStatus.LOANED)
            throw new BusinessException("Gerät ist aktuell ausgeliehen und kann nicht gelöscht werden");
        unitRepo.delete(u);
        log.info("HardwareUnit gelöscht: {}", unitId);
    }

    private void assertAssetTagFree(String tag, HardwareUnit current) {
        if (tag == null || tag.isBlank()) return;
        if (current != null && tag.equals(current.getAssetTag())) return;
        if (unitRepo.existsByAssetTag(tag))
            throw new BusinessException("Asset-Tag bereits vorhanden: " + tag);
    }

    private void assertSerialFree(String serial, HardwareUnit current) {
        if (serial == null || serial.isBlank()) return;
        if (current != null && serial.equals(current.getSerialNumber())) return;
        if (unitRepo.existsBySerialNumber(serial))
            throw new BusinessException("Seriennummer bereits vorhanden: " + serial);
    }
}

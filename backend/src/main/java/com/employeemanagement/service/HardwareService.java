package com.employeemanagement.service;

import com.employeemanagement.dto.HardwareDTO;
import com.employeemanagement.dto.HardwareUnitDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.HardwareMapper;
import com.employeemanagement.mapper.HardwareUnitMapper;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.HardwareUnit;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.HardwareUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HardwareService {

    private final HardwareRepository repo;
    private final HardwareUnitRepository unitRepo;
    private final HardwareMapper mapper;
    private final HardwareUnitMapper unitMapper;

    @Transactional(readOnly = true)
    public Page<HardwareDTO> findAll(Pageable pageable, String search, String status) {
        HardwareUnit.HardwareUnitStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            statusEnum = HardwareUnit.HardwareUnitStatus.valueOf(status.toUpperCase());
        }
        return repo.search(search, statusEnum, pageable).map(mapper::toDTO);
    }

    @Transactional(readOnly = true)
    public HardwareDTO findById(Long id) {
        return repo.findById(id)
                .map(mapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Hardware", id));
    }

    public HardwareDTO create(HardwareDTO dto) {
        if (dto.getUnits() == null || dto.getUnits().isEmpty())
            throw new BusinessException("Mindestens ein Gerät ist erforderlich");

        Set<String> tags = new HashSet<>();
        Set<String> serials = new HashSet<>();
        for (HardwareUnitDTO u : dto.getUnits()) {
            if (u.getAssetTag() == null || u.getAssetTag().isBlank()) {
                u.setAssetTag(nextAssetTag(tags));
            }
            if (!tags.add(u.getAssetTag()))
                throw new BusinessException("Doppelter Asset-Tag in Anfrage: " + u.getAssetTag());
            if (u.getSerialNumber() != null && !u.getSerialNumber().isBlank() && !serials.add(u.getSerialNumber()))
                throw new BusinessException("Doppelte Seriennummer in Anfrage: " + u.getSerialNumber());
            if (unitRepo.existsByAssetTag(u.getAssetTag()))
                throw new BusinessException("Asset-Tag bereits vorhanden: " + u.getAssetTag());
            if (u.getSerialNumber() != null && !u.getSerialNumber().isBlank()
                    && unitRepo.existsBySerialNumber(u.getSerialNumber()))
                throw new BusinessException("Seriennummer bereits vorhanden: " + u.getSerialNumber());
        }

        Hardware hw = mapper.toEntity(dto);
        List<HardwareUnit> units = dto.getUnits().stream()
                .map(u -> unitMapper.toEntity(u, hw))
                .toList();
        hw.getUnits().addAll(units);
        Hardware saved = repo.save(hw);
        log.info("Hardware angelegt: {} mit {} Gerät(en)", saved.getName(), units.size());
        return mapper.toDTO(saved);
    }

    private String nextAssetTag(Set<String> reservedInRequest) {
        long count = unitRepo.count();
        int n = (int) count + 1;
        while (true) {
            String candidate = String.format("HW-%04d", n);
            if (!reservedInRequest.contains(candidate) && !unitRepo.existsByAssetTag(candidate)) {
                return candidate;
            }
            n++;
        }
    }

    public HardwareDTO update(Long id, HardwareDTO dto) {
        Hardware existing = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hardware", id));
        mapper.updateEntity(dto, existing);
        return mapper.toDTO(repo.save(existing));
    }

    public void delete(Long id) {
        Hardware hw = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hardware", id));
        boolean anyLoaned = hw.getUnits().stream()
                .anyMatch(u -> u.getStatus() == HardwareUnit.HardwareUnitStatus.LOANED);
        if (anyLoaned)
            throw new BusinessException("Mindestens ein Gerät ist ausgeliehen — Löschen nicht möglich");
        repo.delete(hw);
        log.info("Hardware gelöscht: {}", id);
    }
}

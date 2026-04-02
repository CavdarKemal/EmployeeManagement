package com.employeemanagement.service;

import com.employeemanagement.dto.HardwareDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.HardwareMapper;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.repository.HardwareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HardwareService {

    private final HardwareRepository repo;
    private final HardwareMapper mapper;

    @Transactional(readOnly = true)
    public Page<HardwareDTO> findAll(Pageable pageable, String search, String status) {
        Hardware.HardwareStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            statusEnum = Hardware.HardwareStatus.valueOf(status.toUpperCase());
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
        if (repo.existsByAssetTag(dto.getAssetTag()))
            throw new BusinessException("Asset-Tag bereits vorhanden: " + dto.getAssetTag());
        if (dto.getSerialNumber() != null && repo.existsBySerialNumber(dto.getSerialNumber()))
            throw new BusinessException("Seriennummer bereits vorhanden: " + dto.getSerialNumber());

        Hardware saved = repo.save(mapper.toEntity(dto));
        log.info("Hardware angelegt: {} ({})", saved.getName(), saved.getAssetTag());
        return mapper.toDTO(saved);
    }

    public HardwareDTO update(Long id, HardwareDTO dto) {
        Hardware existing = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hardware", id));

        if (!existing.getAssetTag().equals(dto.getAssetTag()) && repo.existsByAssetTag(dto.getAssetTag()))
            throw new BusinessException("Asset-Tag bereits vorhanden: " + dto.getAssetTag());

        mapper.updateEntity(dto, existing);
        return mapper.toDTO(repo.save(existing));
    }

    public void delete(Long id) {
        Hardware hw = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hardware", id));
        if (hw.getStatus() == Hardware.HardwareStatus.LOANED)
            throw new BusinessException("Hardware ist aktuell ausgeliehen und kann nicht gelöscht werden");
        repo.delete(hw);
        log.info("Hardware gelöscht: {}", id);
    }
}

package com.employeemanagement.service;

import com.employeemanagement.dto.EmployeeDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.EmployeeMapper;
import com.employeemanagement.model.Employee;
import com.employeemanagement.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeeService {

    private final EmployeeRepository repo;
    private final EmployeeMapper mapper;

    @Transactional(readOnly = true)
    public Page<EmployeeDTO> findAll(Pageable pageable, String search) {
        return repo.searchActive(search, pageable).map(mapper::toDTO);
    }

    @Transactional(readOnly = true)
    public EmployeeDTO findById(Long id) {
        return repo.findById(id)
                .map(mapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Mitarbeiter", id));
    }

    public EmployeeDTO create(EmployeeDTO dto, MultipartFile photo) {
        if (repo.existsByEmail(dto.getEmail()))
            throw new BusinessException("E-Mail bereits vorhanden: " + dto.getEmail());
        if (repo.existsByEmployeeNumber(dto.getEmployeeNumber()))
            throw new BusinessException("Mitarbeiternummer bereits vorhanden: " + dto.getEmployeeNumber());

        Employee entity = mapper.toEntity(dto);

        if (photo != null && !photo.isEmpty()) {
            String photoUrl = savePhoto(photo, dto.getEmployeeNumber());
            entity.setPhotoUrl(photoUrl);
        }

        Employee saved = repo.save(entity);
        log.info("Mitarbeiter angelegt: {} ({})", saved.getEmail(), saved.getEmployeeNumber());
        return mapper.toDTO(saved);
    }

    public EmployeeDTO update(Long id, EmployeeDTO dto) {
        Employee existing = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mitarbeiter", id));

        // E-Mail-Änderung auf Duplikat prüfen
        if (!existing.getEmail().equals(dto.getEmail()) && repo.existsByEmail(dto.getEmail()))
            throw new BusinessException("E-Mail bereits vorhanden: " + dto.getEmail());

        mapper.updateEntity(dto, existing);
        return mapper.toDTO(repo.save(existing));
    }

    public void deactivate(Long id) {
        Employee emp = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mitarbeiter", id));
        emp.setActive(false);
        repo.save(emp);
        log.info("Mitarbeiter deaktiviert: {}", id);
    }

    private String savePhoto(MultipartFile file, String employeeNumber) {
        try {
            String ext = FilenameUtils.getExtension(file.getOriginalFilename());
            String filename = employeeNumber + "_" + UUID.randomUUID() + "." + ext;
            Path uploadDir = Paths.get("./uploads/photos");
            Files.createDirectories(uploadDir);
            Path target = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/photos/" + filename;
        } catch (IOException e) {
            throw new BusinessException("Foto-Upload fehlgeschlagen: " + e.getMessage());
        }
    }
}

package com.employeemanagement.mapper;

import com.employeemanagement.dto.HardwareUnitDTO;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.HardwareUnit;
import org.springframework.stereotype.Component;

@Component
public class HardwareUnitMapper {

    public HardwareUnitDTO toDTO(HardwareUnit u) {
        if (u == null) return null;
        return HardwareUnitDTO.builder()
                .id(u.getId())
                .hardwareId(u.getHardware() != null ? u.getHardware().getId() : null)
                .assetTag(u.getAssetTag())
                .serialNumber(u.getSerialNumber())
                .purchaseDate(u.getPurchaseDate())
                .purchasePrice(u.getPurchasePrice())
                .warrantyUntil(u.getWarrantyUntil())
                .status(u.getStatus() != null ? u.getStatus().name() : null)
                .notes(u.getNotes())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    public HardwareUnit toEntity(HardwareUnitDTO dto, Hardware hardware) {
        HardwareUnit u = HardwareUnit.builder()
                .hardware(hardware)
                .assetTag(dto.getAssetTag())
                .serialNumber(emptyToNull(dto.getSerialNumber()))
                .purchaseDate(dto.getPurchaseDate())
                .purchasePrice(dto.getPurchasePrice())
                .warrantyUntil(dto.getWarrantyUntil())
                .notes(dto.getNotes())
                .build();
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            u.setStatus(HardwareUnit.HardwareUnitStatus.valueOf(dto.getStatus().toUpperCase()));
        }
        return u;
    }

    public void updateEntity(HardwareUnitDTO dto, HardwareUnit target) {
        target.setAssetTag(dto.getAssetTag());
        target.setSerialNumber(emptyToNull(dto.getSerialNumber()));
        target.setPurchaseDate(dto.getPurchaseDate());
        target.setPurchasePrice(dto.getPurchasePrice());
        target.setWarrantyUntil(dto.getWarrantyUntil());
        target.setNotes(dto.getNotes());
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            target.setStatus(HardwareUnit.HardwareUnitStatus.valueOf(dto.getStatus().toUpperCase()));
        }
    }

    private String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}

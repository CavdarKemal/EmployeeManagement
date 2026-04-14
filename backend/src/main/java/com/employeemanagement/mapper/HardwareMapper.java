package com.employeemanagement.mapper;

import com.employeemanagement.dto.HardwareDTO;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.HardwareUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class HardwareMapper {

    private final HardwareUnitMapper unitMapper;

    public HardwareDTO toDTO(Hardware h) {
        if (h == null) return null;
        List<HardwareUnit> units = h.getUnits() != null ? h.getUnits() : List.of();
        long available = units.stream()
                .filter(u -> u.getStatus() == HardwareUnit.HardwareUnitStatus.AVAILABLE)
                .count();
        return HardwareDTO.builder()
                .id(h.getId())
                .name(h.getName())
                .category(h.getCategory())
                .manufacturer(h.getManufacturer())
                .model(h.getModel())
                .notes(h.getNotes())
                .totalQuantity(units.size())
                .availableQuantity((int) available)
                .units(units.stream().map(unitMapper::toDTO).collect(Collectors.toList()))
                .createdAt(h.getCreatedAt())
                .updatedAt(h.getUpdatedAt())
                .build();
    }

    public Hardware toEntity(HardwareDTO dto) {
        return Hardware.builder()
                .name(dto.getName())
                .category(dto.getCategory())
                .manufacturer(dto.getManufacturer())
                .model(dto.getModel())
                .notes(dto.getNotes())
                .build();
    }

    public void updateEntity(HardwareDTO dto, Hardware target) {
        target.setName(dto.getName());
        target.setCategory(dto.getCategory());
        target.setManufacturer(dto.getManufacturer());
        target.setModel(dto.getModel());
        target.setNotes(dto.getNotes());
    }
}

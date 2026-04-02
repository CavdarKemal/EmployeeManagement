package com.employeemanagement.mapper;

import com.employeemanagement.dto.HardwareDTO;
import com.employeemanagement.model.Hardware;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface HardwareMapper {

    @Mapping(target = "status", expression = "java(entity.getStatus() != null ? entity.getStatus().name() : null)")
    HardwareDTO toDTO(Hardware entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "loans", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "status", expression = "java(dto.getStatus() != null ? Hardware.HardwareStatus.valueOf(dto.getStatus()) : Hardware.HardwareStatus.AVAILABLE)")
    Hardware toEntity(HardwareDTO dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "loans", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "status", expression = "java(dto.getStatus() != null ? Hardware.HardwareStatus.valueOf(dto.getStatus()) : entity.getStatus())")
    void updateEntity(HardwareDTO dto, @MappingTarget Hardware entity);
}

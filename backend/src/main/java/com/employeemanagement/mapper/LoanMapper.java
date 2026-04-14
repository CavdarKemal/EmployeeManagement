package com.employeemanagement.mapper;

import com.employeemanagement.dto.LoanDTO;
import com.employeemanagement.model.Loan;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface LoanMapper {

    @Mapping(target = "employeeId",     source = "employee.id")
    @Mapping(target = "employeeName",   expression = "java(loan.getEmployee().getFirstName() + ' ' + loan.getEmployee().getLastName())")
    @Mapping(target = "hardwareUnitId", source = "hardwareUnit.id")
    @Mapping(target = "hardwareId",     source = "hardwareUnit.hardware.id")
    @Mapping(target = "hardwareName",   source = "hardwareUnit.hardware.name")
    @Mapping(target = "assetTag",       source = "hardwareUnit.assetTag")
    @Mapping(target = "serialNumber",   source = "hardwareUnit.serialNumber")
    @Mapping(target = "active",         expression = "java(loan.isActive())")
    LoanDTO toDTO(Loan loan);
}

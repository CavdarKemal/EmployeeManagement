package com.employeemanagement.dto;

import com.employeemanagement.model.AppUser;
import lombok.Data;

@Data
public class UpdateUserDTO {

    private String displayName;
    private AppUser.Role role;
    private Boolean enabled;
}

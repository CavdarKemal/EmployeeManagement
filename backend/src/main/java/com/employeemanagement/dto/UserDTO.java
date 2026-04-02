package com.employeemanagement.dto;

import com.employeemanagement.model.AppUser;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String displayName;
    private AppUser.Role role;
    private boolean enabled;
    private boolean accountNonLocked;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}

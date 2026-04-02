package com.employeemanagement.dto;

import com.employeemanagement.model.AppUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateUserDTO {

    @Email(message = "Ungültige E-Mail-Adresse")
    @NotBlank
    private String email;

    @NotBlank(message = "Anzeigename ist pflicht")
    private String displayName;

    @NotBlank(message = "Passwort ist pflicht")
    @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen haben")
    private String initialPassword;

    @NotNull(message = "Rolle ist pflicht")
    private AppUser.Role role;
}

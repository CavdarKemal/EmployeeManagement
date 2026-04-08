package com.employeemanagement.service;

import com.employeemanagement.dto.CreateUserDTO;
import com.employeemanagement.dto.UserDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.model.AppUser;
import com.employeemanagement.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepo;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks UserService service;

    @Test
    @DisplayName("loadUserByUsername – vorhandener Benutzer wird geladen")
    void loadUserByUsername_success() {
        AppUser user = AppUser.builder().id(1L).email("admin@firma.de")
                .passwordHash("hash").displayName("Admin").role(AppUser.Role.ADMIN).build();
        when(userRepo.findByEmail("admin@firma.de")).thenReturn(Optional.of(user));

        var result = service.loadUserByUsername("admin@firma.de");

        assertThat(result.getUsername()).isEqualTo("admin@firma.de");
    }

    @Test
    @DisplayName("loadUserByUsername – nicht vorhandener Benutzer wirft Exception")
    void loadUserByUsername_notFound() {
        when(userRepo.findByEmail("x@y.de")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> service.loadUserByUsername("x@y.de"));
    }

    @Test
    @DisplayName("createUser – neuer Benutzer wird angelegt")
    void createUser_success() {
        CreateUserDTO dto = new CreateUserDTO();
        dto.setEmail("new@firma.de");
        dto.setDisplayName("Neu");
        dto.setInitialPassword("pass123");
        dto.setRole(AppUser.Role.VIEWER);

        when(userRepo.existsByEmail("new@firma.de")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("$2a$hash");
        when(userRepo.save(any(AppUser.class))).thenAnswer(inv -> {
            AppUser u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        UserDTO result = service.createUser(dto);

        assertThat(result.getEmail()).isEqualTo("new@firma.de");
        assertThat(result.getRole()).isEqualTo(AppUser.Role.VIEWER);
        verify(userRepo).save(any(AppUser.class));
    }

    @Test
    @DisplayName("createUser – doppelte E-Mail wirft BusinessException")
    void createUser_duplicateEmail() {
        CreateUserDTO dto = new CreateUserDTO();
        dto.setEmail("dup@firma.de");
        dto.setDisplayName("Dup");
        dto.setInitialPassword("pass");
        dto.setRole(AppUser.Role.VIEWER);

        when(userRepo.existsByEmail("dup@firma.de")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createUser(dto));
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("updateRole – Rolle wird geändert")
    void updateRole_success() {
        AppUser user = AppUser.builder().id(1L).email("u@f.de")
                .passwordHash("h").displayName("U").role(AppUser.Role.VIEWER).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(user)).thenReturn(user);

        UserDTO result = service.updateRole(1L, AppUser.Role.HR);

        assertThat(result.getRole()).isEqualTo(AppUser.Role.HR);
    }

    @Test
    @DisplayName("updateRole – letzter Admin kann nicht degradiert werden")
    void updateRole_lastAdmin() {
        AppUser admin = AppUser.builder().id(1L).email("a@f.de")
                .passwordHash("h").displayName("A").role(AppUser.Role.ADMIN).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepo.countByRole(AppUser.Role.ADMIN)).thenReturn(1L);

        assertThrows(BusinessException.class,
                () -> service.updateRole(1L, AppUser.Role.VIEWER));
    }

    @Test
    @DisplayName("updateRole – nicht vorhandener Benutzer wirft Exception")
    void updateRole_notFound() {
        when(userRepo.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.updateRole(99L, AppUser.Role.HR));
    }

    @Test
    @DisplayName("resetPassword – Passwort wird geändert")
    void resetPassword_success() {
        AppUser user = AppUser.builder().id(1L).email("u@f.de")
                .passwordHash("old").displayName("U").role(AppUser.Role.VIEWER).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpass")).thenReturn("$2a$new");

        service.resetPassword(1L, "newpass");

        assertThat(user.getPasswordHash()).isEqualTo("$2a$new");
        verify(userRepo).save(user);
    }
}

package com.employeemanagement.controller;

import com.employeemanagement.dto.*;
import com.employeemanagement.model.AppUser;
import com.employeemanagement.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin – Benutzerverwaltung")
@PreAuthorize("hasRole('ADMIN')")     // gesamter Controller nur für ADMIN
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Alle Benutzer (paginiert)")
    public Page<UserDTO> getAll(
            @PageableDefault(size = 20, sort = "email") Pageable pageable,
            @RequestParam(required = false) String search) {
        return userService.findAll(pageable, search);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Benutzer anlegen")
    public UserDTO create(@Valid @RequestBody CreateUserDTO dto) {
        return userService.createUser(dto);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Benutzer bearbeiten")
    public UserDTO update(
            @PathVariable Long id,
            @RequestBody UpdateUserDTO dto) {
        return userService.updateUser(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Benutzer löschen (nur gesperrte)")
    public void delete(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PutMapping("/{id}/role")
    @Operation(summary = "Rolle ändern")
    public UserDTO updateRole(
            @PathVariable Long id,
            @RequestParam AppUser.Role role) {
        return userService.updateRole(id, role);
    }

    @PutMapping("/{id}/toggle-lock")
    @Operation(summary = "Account sperren / entsperren")
    public ResponseEntity<Void> toggleLock(@PathVariable Long id) {
        userService.toggleLock(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reset-password")
    @Operation(summary = "Passwort zurücksetzen")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long id,
            @RequestParam String newPassword) {
        userService.resetPassword(id, newPassword);
        return ResponseEntity.noContent().build();
    }
}

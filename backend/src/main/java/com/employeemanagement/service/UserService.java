package com.employeemanagement.service;

import com.employeemanagement.dto.CreateUserDTO;
import com.employeemanagement.dto.UpdateUserDTO;
import com.employeemanagement.dto.UserDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.model.AppUser;
import com.employeemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService implements UserDetailsService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Benutzer nicht gefunden: " + email));
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> findAll(Pageable pageable, String search) {
        return userRepo.search(search, pageable).map(this::toDTO);
    }

    public UserDTO createUser(CreateUserDTO dto) {
        if (userRepo.existsByEmail(dto.getEmail()))
            throw new BusinessException("E-Mail bereits vergeben: " + dto.getEmail());

        AppUser user = AppUser.builder()
                .email(dto.getEmail())
                .displayName(dto.getDisplayName())
                .passwordHash(passwordEncoder.encode(dto.getInitialPassword()))
                .role(dto.getRole())
                .passwordChangedAt(LocalDateTime.now())
                .build();

        AppUser saved = userRepo.save(user);
        log.info("Benutzer angelegt: {} mit Rolle {}", saved.getEmail(), saved.getRole());
        return toDTO(saved);
    }

    public UserDTO updateUser(Long userId, UpdateUserDTO dto) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer", userId));

        if (dto.getDisplayName() != null && !dto.getDisplayName().isBlank())
            user.setDisplayName(dto.getDisplayName());

        if (dto.getEmail() != null && !dto.getEmail().isBlank() && !dto.getEmail().equals(user.getEmail())) {
            if (userRepo.existsByEmail(dto.getEmail()))
                throw new BusinessException("E-Mail bereits vergeben: " + dto.getEmail());
            user.setEmail(dto.getEmail());
        }

        log.info("Benutzer bearbeitet: {} (id={})", user.getEmail(), userId);
        return toDTO(userRepo.save(user));
    }

    public void deleteUser(Long userId) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer", userId));

        if (user.isAccountNonLocked())
            throw new BusinessException("Nur gesperrte Benutzer können gelöscht werden.");

        if (user.getRole() == AppUser.Role.ADMIN) {
            long adminCount = userRepo.countByRole(AppUser.Role.ADMIN);
            if (adminCount <= 1)
                throw new BusinessException("Letzter ADMIN kann nicht gelöscht werden.");
        }

        userRepo.delete(user);
        log.info("Benutzer gelöscht: {} (id={})", user.getEmail(), userId);
    }

    public UserDTO updateRole(Long userId, AppUser.Role newRole) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer", userId));

        // Letzten Admin schützen
        if (user.getRole() == AppUser.Role.ADMIN && newRole != AppUser.Role.ADMIN) {
            long adminCount = userRepo.countByRole(AppUser.Role.ADMIN);
            if (adminCount <= 1)
                throw new BusinessException("Mindestens ein ADMIN muss vorhanden bleiben.");
        }

        AppUser.Role oldRole = user.getRole();
        user.setRole(newRole);
        log.info("Rolle geändert für {}: {} -> {}", user.getEmail(), oldRole, newRole);
        return toDTO(userRepo.save(user));
    }

    public void toggleLock(Long userId) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer", userId));

        // Eigenen Account nicht sperren
        String currentUser = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        if (user.getEmail().equals(currentUser))
            throw new BusinessException("Eigenen Account kann man nicht sperren.");

        user.setAccountNonLocked(!user.isAccountNonLocked());
        log.info("Account {} gesperrt: {}", user.getEmail(), !user.isAccountNonLocked());
        userRepo.save(user);
    }

    public void resetPassword(Long userId, String newPassword) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Benutzer", userId));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepo.save(user);
        log.info("Passwort zurückgesetzt für: {}", user.getEmail());
    }

    public void recordLogin(String email) {
        userRepo.findByEmail(email).ifPresent(u -> {
            u.setLastLoginAt(LocalDateTime.now());
            userRepo.save(u);
        });
    }

    private UserDTO toDTO(AppUser u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setDisplayName(u.getDisplayName());
        dto.setRole(u.getRole());
        dto.setEnabled(u.isEnabled());
        dto.setAccountNonLocked(u.isAccountNonLocked());
        dto.setLastLoginAt(u.getLastLoginAt());
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }
}

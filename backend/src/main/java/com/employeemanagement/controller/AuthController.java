package com.employeemanagement.controller;

import com.employeemanagement.dto.JwtResponse;
import com.employeemanagement.dto.LoginRequest;
import com.employeemanagement.model.AppUser;
import com.employeemanagement.repository.UserRepository;
import com.employeemanagement.service.JwtService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Login und Token")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UserRepository userRepo;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        AppUser user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Benutzer nach erfolgreichem Login nicht mehr in DB"));

        String token = jwtService.generateToken(auth.getName());
        JwtResponse resp = new JwtResponse(token, jwtService.getExpirationMs());
        resp.setEmail(user.getEmail());
        resp.setDisplayName(user.getDisplayName());
        resp.setRole(user.getRole().name());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, String>> me() {
        var authObj = SecurityContextHolder.getContext().getAuthentication();
        if (authObj == null || !authObj.isAuthenticated() || "anonymousUser".equals(authObj.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        AppUser user = userRepo.findByEmail(authObj.getName())
                .orElseThrow(() -> new IllegalStateException("Authentifizierter Benutzer nicht in DB"));
        return ResponseEntity.ok(Map.of(
                "email", user.getEmail(),
                "displayName", user.getDisplayName(),
                "role", user.getRole().name()
        ));
    }
}

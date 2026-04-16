package com.employeemanagement.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {

    private String token;
    private long expiresInMs;
    private String tokenType = "Bearer";
    private String email;
    private String displayName;
    private String role;

    public JwtResponse(String token, long expiresInMs) {
        this.token = token;
        this.expiresInMs = expiresInMs;
    }
}

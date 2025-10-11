package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String refreshToken;
    private Integer userId;
    private String username;
    private Boolean isAdmin;
    private Boolean isModerator;

}
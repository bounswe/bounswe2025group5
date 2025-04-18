package com.example.CMPE352.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private Boolean isAdmin;
    private Boolean isModerator;

}
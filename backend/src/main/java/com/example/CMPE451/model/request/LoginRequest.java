package com.example.CMPE352.model.request;

import lombok.Data;

@Data
public class LoginRequest {
    private String emailOrUsername;
    private String password;
}
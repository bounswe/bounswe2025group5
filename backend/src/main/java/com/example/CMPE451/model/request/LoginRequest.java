package com.example.CMPE451.model.request;

import lombok.Data;

@Data
public class LoginRequest {
    private String emailOrUsername;
    private String password;
}
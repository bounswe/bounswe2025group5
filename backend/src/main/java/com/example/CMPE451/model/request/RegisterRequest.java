package com.example.CMPE451.model.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String username;
    private String password;
}
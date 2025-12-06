package com.example.CMPE451.model.request;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String emailOrUsername;
    private String oldPassword;
    private String newPassword;
}
package com.example.CMPE352.model.request;

import lombok.Data;

@Data
public class ProfileEditRequest {
    private String biography;
    private String photoUrl;
}
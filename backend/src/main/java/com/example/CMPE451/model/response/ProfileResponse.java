package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProfileResponse {
    private String username;
    private String biography;
    private String photoUrl;
    private Integer followerCount;
    private Integer followingCount;
}

package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserDeleteResponse {
    private Integer userId;
    private String username;
}

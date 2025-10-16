package com.example.CMPE451.model.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LogChallengeRequest {
    private String username;
    private Double amount;
}

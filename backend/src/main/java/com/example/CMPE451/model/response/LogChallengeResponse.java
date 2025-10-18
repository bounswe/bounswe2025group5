package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LogChallengeResponse {
    private String username;
    private Integer challengeId;
    private Double newTotalAmount;
}

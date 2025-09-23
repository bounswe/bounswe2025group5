package com.example.CMPE352.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AttendChallengeResponse {
    private String username;
    private Double remainingAmount;
    private int challengeId;
}
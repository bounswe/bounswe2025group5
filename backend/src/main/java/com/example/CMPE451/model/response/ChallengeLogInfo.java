package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChallengeLogInfo {
    private Double amount;
    private LocalDateTime timestamp;
}

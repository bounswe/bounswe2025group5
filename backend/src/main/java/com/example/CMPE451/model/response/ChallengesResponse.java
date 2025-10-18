package com.example.CMPE451.model.response;

import com.example.CMPE451.model.Challenge;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChallengesResponse {
    private int challengeId;
    private String name;
    private Double amount;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Challenge.Status status;
    private String type;
}

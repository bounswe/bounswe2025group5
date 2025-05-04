package com.example.CMPE352.model.response;

import com.example.CMPE352.model.Challenge;
import com.example.CMPE352.model.WasteGoal;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ChallengeListResponse {
    private int challengeId;
    private String name;
    private Double amount;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Challenge.Status status;
    private WasteGoal.wasteType wasteType;
    private boolean isAttendee;
}

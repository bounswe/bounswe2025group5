package com.example.CMPE451.model.response;

import lombok.Data;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Data
public class GetWasteGoalResponse {
    private Integer goalId;
    private String wasteType;
    private Double restrictionAmountGrams;
    private Integer duration;
    private Double progress;
    private LocalDateTime createdAt;
    private String creatorUsername;
}
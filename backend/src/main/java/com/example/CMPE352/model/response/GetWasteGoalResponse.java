package com.example.CMPE352.model.response;

import lombok.Data;

import java.sql.Timestamp;

@Data
public class GetWasteGoalResponse {
    private Integer goalId;
    private String wasteType;
    private Double amount;
    private Integer duration;
    private String unit;
    private Double progress;
    private Timestamp createdAt;
    private String creatorUsername;
}
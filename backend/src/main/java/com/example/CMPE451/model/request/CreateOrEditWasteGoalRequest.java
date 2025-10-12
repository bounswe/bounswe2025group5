package com.example.CMPE451.model.request;

import lombok.Data;

@Data
public class CreateOrEditWasteGoalRequest {
    private int duration;
    private double restrictionAmountGrams;
    private String type;
}
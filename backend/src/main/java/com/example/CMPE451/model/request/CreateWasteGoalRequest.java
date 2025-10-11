package com.example.CMPE451.model.request;

import com.example.CMPE451.model.WasteGoal.wasteType;
import com.example.CMPE451.model.WasteGoal.wasteUnit;
import lombok.Data;

@Data
public class CreateWasteGoalRequest {
    private int duration;
    private wasteUnit unit;
    private wasteType wasteType;
    private double amount;
}
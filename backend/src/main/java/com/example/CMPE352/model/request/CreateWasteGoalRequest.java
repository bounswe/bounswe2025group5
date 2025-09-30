package com.example.CMPE352.model.request;

import com.example.CMPE352.model.WasteGoal.wasteType;
import com.example.CMPE352.model.WasteGoal.wasteUnit;
import lombok.Data;

@Data
public class CreateWasteGoalRequest {
    private String username;
    private int duration;
    private wasteUnit unit;
    private wasteType wasteType;
    private double amount;
}
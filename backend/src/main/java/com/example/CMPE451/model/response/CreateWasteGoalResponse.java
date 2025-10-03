package com.example.CMPE451.model.response;

import com.example.CMPE451.model.WasteGoal.wasteType;
import com.example.CMPE451.model.WasteGoal.wasteUnit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateWasteGoalResponse {
    private String username;
    private Integer goalId;
}
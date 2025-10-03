package com.example.CMPE352.model.response;

import com.example.CMPE352.model.WasteGoal.wasteType;
import com.example.CMPE352.model.WasteGoal.wasteUnit;
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
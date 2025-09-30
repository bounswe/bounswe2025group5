package com.example.CMPE352.model.request;

import com.example.CMPE352.model.WasteGoal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class CreateChallengeRequest {

    private String name;
    private String description;
    private Double amount;
    private LocalDate startDate;
    private LocalDate endDate;
    private WasteGoal.wasteType wasteType;
}
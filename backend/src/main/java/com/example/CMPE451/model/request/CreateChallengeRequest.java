package com.example.CMPE451.model.request;

import com.example.CMPE451.model.WasteGoal;
import com.example.CMPE451.model.WasteType;
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
    private WasteType wasteType;
}
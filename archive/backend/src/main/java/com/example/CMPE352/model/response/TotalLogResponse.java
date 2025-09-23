package com.example.CMPE352.model.response;

import com.example.CMPE352.model.WasteGoal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TotalLogResponse {
    private WasteGoal.wasteType   wasteType;
    private  double totalAmount;
}
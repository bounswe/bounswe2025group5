package com.example.CMPE451.model.response;

import com.example.CMPE451.model.WasteGoal;
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
package com.example.CMPE451.model.response;

import com.example.CMPE451.model.WasteGoal;
import com.example.CMPE451.model.WasteType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TotalLogResponse {
    private WasteType wasteType;
    private  double totalAmount;
}
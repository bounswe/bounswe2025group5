package com.example.CMPE451.model.response;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WasteLogMonthlyResponse {
    private String username;
    private String wasteType;
    private List<MonthlyWasteData> monthlyData;
}
package com.example.CMPE352.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AirQualityResponse {
    public Double pm10;
    public Double pm25;
    public Double carbonMonoxide;
    public Double nitrogenDioxide;
    public Double sulphurDioxide;
    public Double ozone;
}

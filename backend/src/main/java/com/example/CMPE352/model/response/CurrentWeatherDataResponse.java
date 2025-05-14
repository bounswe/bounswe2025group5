// src/main/java/com/example/CMPE352/model/response/CurrentWeatherResponse.java
package com.example.CMPE352.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;



@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrentWeatherDataResponse {
    private Double temperature;
    private Integer humidity;
    }

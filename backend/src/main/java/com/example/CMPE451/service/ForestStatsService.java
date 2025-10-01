package com.example.CMPE451.service;

import com.example.CMPE451.model.response.WorldBankResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ForestStatsService {

    private final String API_URL =
        "https://api.worldbank.org/v2/country/WLD/indicator/AG.LND.FRST.K2?format=json&per_page=100";

    // Hardcoded previous year and value
    private final String previousYear = "2021";
    private final double previousArea = 40449373.704;

    public double getForestReductionOnly() {
        RestTemplate restTemplate = new RestTemplate();
        Object[] response = restTemplate.getForObject(API_URL, Object[].class);

        if (response != null && response.length > 1) {
            ObjectMapper mapper = new ObjectMapper();
            WorldBankResponse[] data = mapper.convertValue(response[1], WorldBankResponse[].class);

            for (WorldBankResponse entry : data) {
                if (entry.getValue() != null) {
                    return previousArea - entry.getValue();
                }
            }
        }

        throw new RuntimeException("No valid forest area data found.");
    }
}

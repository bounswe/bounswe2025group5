package com.example.CMPE352.service;

import com.example.CMPE352.model.response.WasteStatResponse;
import com.example.CMPE352.model.response.WorldBankResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class WasteStatsService {

    private final String BASE_URL = "https://api.worldbank.org/v2/country/%s/indicator/EG.FEC.RNEW.ZS?format=json";

    public WasteStatResponse fetchWasteStat(String countryCode) {
        RestTemplate restTemplate = new RestTemplate();

        String url = String.format(BASE_URL, countryCode.toUpperCase());
        Object[] response = restTemplate.getForObject(url, Object[].class);

        if (response != null && response.length > 1) {
            // second element is the actual data list
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            WorldBankResponse[] data = mapper.convertValue(response[1], WorldBankResponse[].class);

            for (WorldBankResponse entry : data) {
                if (entry.getValue() != null) {
                    WasteStatResponse result = new WasteStatResponse();
                    result.setCountry(entry.getCountry().getValue());
                    result.setYear(entry.getDate());
                    result.setValue(entry.getValue());
                    return result;
                }
            }
        }

        // fallback response
        WasteStatResponse fallback = new WasteStatResponse();
        fallback.setCountry(countryCode);
        fallback.setYear("N/A");
        fallback.setValue(null);
        return fallback;
    }
}
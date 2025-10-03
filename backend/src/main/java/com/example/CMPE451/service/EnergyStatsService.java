package com.example.CMPE451.service;

import com.example.CMPE451.model.response.EnergyStatResponse;
import com.example.CMPE451.model.response.WorldBankResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

@Service
public class EnergyStatsService {

    private final String BASE_URL = "https://api.worldbank.org/v2/country/%s/indicator/EG.FEC.RNEW.ZS?format=json&per_page=50";

    public List<EnergyStatResponse> fetchEnergyStats(String countryCode) {
        RestTemplate restTemplate = new RestTemplate();

        String url = String.format(BASE_URL, countryCode.toUpperCase());
        Object[] response = restTemplate.getForObject(url, Object[].class);

        List<EnergyStatResponse> results = new ArrayList<>();

        if (response != null && response.length > 1) {
            ObjectMapper mapper = new ObjectMapper();
            WorldBankResponse[] data = mapper.convertValue(response[1], WorldBankResponse[].class);

            for (WorldBankResponse entry : data) {
                if (entry.getValue() != null) {
                    EnergyStatResponse result = new EnergyStatResponse();
                    result.setCountry(entry.getCountry().getValue());
                    result.setYear(entry.getDate());
                    result.setValue(entry.getValue());
                    results.add(result);
                }
            }
        }

        return results;
    }
}

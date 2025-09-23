package com.example.CMPE352.service;

import com.example.CMPE352.model.response.AirQualityResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Locale;

@Service
public class AirQualityService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AirQualityService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public AirQualityResponse getAirQualityData(String locationName) {
        try {
            String geoUrl = String.format("https://geocoding-api.open-meteo.com/v1/search?name=%s", locationName);
            String geoResponse = restTemplate.getForObject(geoUrl, String.class);
            JsonNode geoRoot = objectMapper.readTree(geoResponse);
            JsonNode firstResult = geoRoot.path("results").get(0);

            if (firstResult == null || firstResult.isNull()) {
                throw new RuntimeException("No coordinates found for location: " + locationName);
            }

            double latitude = firstResult.path("latitude").asDouble();
            double longitude = firstResult.path("longitude").asDouble();

            // Step 2: Fetch air quality data using coordinates
            String airUrl = String.format(
                    Locale.US,
                    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%f&longitude=%f&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto",
                    latitude, longitude
            );

            String response = restTemplate.getForObject(airUrl, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode hourly = root.path("hourly");

            Double pm10 = getLatestValue(hourly, "pm10");
            Double pm25 = getLatestValue(hourly, "pm2_5");
            Double carbonMonoxide = getLatestValue(hourly, "carbon_monoxide");
            Double nitrogenDioxide = getLatestValue(hourly, "nitrogen_dioxide");
            Double sulphurDioxide = getLatestValue(hourly, "sulphur_dioxide");
            Double ozone = getLatestValue(hourly, "ozone");

            return new AirQualityResponse(pm10, pm25, carbonMonoxide, nitrogenDioxide, sulphurDioxide, ozone);

        } catch (Exception e) {
            throw new RuntimeException("Error processing API response: " + e.getMessage(), e);
        }
    }

    private Double getLatestValue(JsonNode node, String key) {
        JsonNode array = node.get(key);
        if (array != null && array.isArray()) {
            for (int i = array.size() - 1; i >= 0; i--) {
                JsonNode value = array.get(i);
                if (value != null && !value.isNull()) {
                    return value.asDouble();
                }
            }
        }
        return null;
    }
}

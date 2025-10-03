package com.example.CMPE451.service;

import com.example.CMPE451.model.response.CurrentWeatherDataResponse; // Use your response class
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Locale;

@Service
public class CurrentWeatherService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${weather.api.key}")
    private String API_KEY;
    
    // Coordinates for Istanbul
    private static final double ISTANBUL_LAT = 41.0082;
    private static final double ISTANBUL_LON = 28.9784;

    public CurrentWeatherService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public CurrentWeatherDataResponse getCurrentWeather() {
        try {
           String weatherUrl = String.format("https://api.openweathermap.org/data/2.5/weather" +
                    "?lat=" + ISTANBUL_LAT +
                    "&lon=" + ISTANBUL_LON +
                    "&appid=" + API_KEY +
                    "&units=metric"); // Add units=metric for Celsius
                
            String weatherResponse = restTemplate.getForObject(weatherUrl, String.class);
            JsonNode root = objectMapper.readTree(weatherResponse);

            if (root.has("cod") && root.path("cod").asInt() != 200) {
                String errorMessage = root.has("message") ? root.path("message").asText() : "Unknown API error";
                throw new RuntimeException("OpenWeatherMap API error (" + root.path("cod").asText() + "): " + errorMessage);
            }

           
            JsonNode mainNode = root.path("main");

            if (mainNode.isMissingNode()) {
                throw new RuntimeException("'main' data is missing in API response for Istanbul.");
            }

            Double temperature = null;
            if (mainNode.has("temp") && !mainNode.get("temp").isNull()) {
                temperature = mainNode.path("temp").asDouble();
            }

            Integer humidity = null;
            if (mainNode.has("humidity") && !mainNode.get("humidity").isNull()) {
                humidity = mainNode.path("humidity").asInt();
            }

            return new CurrentWeatherDataResponse(temperature, humidity);

        } catch (Exception e) {
            System.err.println("Error fetching or processing current weather data for Istanbul: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error fetching current weather data for Istanbul: " + e.getMessage(), e);
        }
    }
}
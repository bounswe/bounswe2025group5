package com.example.CMPE352.service;

import com.example.CMPE352.model.response.CurrentWeatherDataResponse; // Use your response class
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Locale;

@Service
public class CurrentWeatherService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // --- IMPORTANT: Replace with your actual API Key ---
    private static final String API_KEY = "2249ba813facfe4ce77ee68589dc3544";
    
    // Coordinates for Istanbul
    private static final double ISTANBUL_LAT = 41.0082;
    private static final double ISTANBUL_LON = 28.9784;

    public CurrentWeatherService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public CurrentWeatherDataResponse getCurrentWeather() {
        try {
            // Build the URL for the current weather API
            // the url is https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}
            String weatherUrl = String.format("https://api.openweathermap.org/data/2.5/weather" +
                    "?lat=" + ISTANBUL_LAT +
                    "&lon=" + ISTANBUL_LON +
                    "&appid=" + API_KEY +
                    "&units=metric"); // Add units=metric for Celsius
                
            String weatherResponse = restTemplate.getForObject(weatherUrl, String.class);
            JsonNode root = objectMapper.readTree(weatherResponse);

            // Check for API errors (OpenWeatherMap returns "cod" which is usually an integer for this API or string "200")
            // For the /weather endpoint, successful "cod" is the integer 200.
            if (root.has("cod") && root.path("cod").asInt() != 200) {
                String errorMessage = root.has("message") ? root.path("message").asText() : "Unknown API error";
                throw new RuntimeException("OpenWeatherMap API error (" + root.path("cod").asText() + "): " + errorMessage);
            }

            // The "main" object directly contains temperature and humidity
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
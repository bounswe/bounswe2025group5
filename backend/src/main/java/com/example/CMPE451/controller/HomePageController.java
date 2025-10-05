package com.example.CMPE451.controller;

import com.example.CMPE451.model.response.AirQualityResponse;
import com.example.CMPE451.model.response.EnergyStatResponse;
import com.example.CMPE451.service.*;
import com.example.CMPE451.model.response.CurrentWeatherDataResponse;
import com.example.CMPE451.model.response.NumberTriviaResponse;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.CMPE451.model.response.MotivationalQuoteResponse;
import com.example.CMPE451.service.EnergyStatsService;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomePageController {

    private final MotivationService motivationService;
    private final AirQualityService airQualityService;
    private final NumberService numberService;
    private final CurrentWeatherService currentWeatherService;
    private final EnergyStatsService energyStatsService;
    private final ForestStatsService forestStatsService;

    @GetMapping("/quotes/motivational")
    public ResponseEntity<MotivationalQuoteResponse> getMotivationalQuote() {
        MotivationalQuoteResponse quote = motivationService.fetchMotivationalQuote();
        return ResponseEntity.ok(quote);
    }

    @GetMapping("/numbers/{number}/trivia")
    public ResponseEntity<NumberTriviaResponse> getNumberTrivia(@PathVariable int number) {
        NumberTriviaResponse trivia = numberService.fetchNumberTrivia(number);
        return ResponseEntity.ok(trivia);
    }

    @GetMapping("/energy/{countryCode}")
    public List<EnergyStatResponse> getEnergyStats(@PathVariable String countryCode) {
        return energyStatsService.fetchEnergyStats(countryCode);
    }

    @GetMapping("/air-quality")
    public AirQualityResponse getAirQuality(@RequestParam String location) {
        return airQualityService.getAirQualityData(location);
    }
    @GetMapping("/forests/reduction")
    public ResponseEntity<Double> getForestReduction() {
        double reduction = forestStatsService.getForestReductionOnly();
        return ResponseEntity.ok(reduction);
    }

    @GetMapping("/weather/current")
    public ResponseEntity<CurrentWeatherDataResponse> getCurrentWeather() {
        CurrentWeatherDataResponse weatherData = currentWeatherService.getCurrentWeather();
        return ResponseEntity.ok(weatherData);
    }

}

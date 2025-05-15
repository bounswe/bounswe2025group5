package com.example.CMPE352.controller;

import com.example.CMPE352.model.response.AirQualityResponse;
import com.example.CMPE352.model.response.EnergyStatResponse;
import com.example.CMPE352.service.*;
import com.example.CMPE352.model.response.CurrentWeatherDataResponse;
import com.example.CMPE352.model.response.NumberTriviaResponse;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.CMPE352.model.response.MotivationalQuoteResponse;
import com.example.CMPE352.service.EnergyStatsService;

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

    @GetMapping("/getMotivated")
    public ResponseEntity<MotivationalQuoteResponse> getMotivationalQuote() {
        MotivationalQuoteResponse quote = motivationService.fetchMotivationalQuote();
        return ResponseEntity.ok(quote);
    }

    @GetMapping("/number/{number}")
    public ResponseEntity<NumberTriviaResponse> getNumberTrivia(@PathVariable int number) {
        NumberTriviaResponse trivia = numberService.fetchNumberTrivia(number);
        return ResponseEntity.ok(trivia);
    }

    @GetMapping("/energy/{countryCode}")
    public List<EnergyStatResponse> getEnergyStats(@PathVariable String countryCode) {
        return energyStatsService.fetchEnergyStats(countryCode);
    }

    @GetMapping("/getAirQuality")
    public AirQualityResponse getAirQuality(@RequestParam String location) {
        return airQualityService.getAirQualityData(location);
    }
    @GetMapping("/forestReduction")
    public ResponseEntity<Double> getForestReduction() {
        double reduction = forestStatsService.getForestReductionOnly();
        return ResponseEntity.ok(reduction);
    }

    @GetMapping("/getCurrentWeather")
    public ResponseEntity<CurrentWeatherDataResponse> getCurrentWeather() {
        CurrentWeatherDataResponse weatherData = currentWeatherService.getCurrentWeather();
        return ResponseEntity.ok(weatherData);
    }

}

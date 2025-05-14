package com.example.CMPE352.controller;

import com.example.CMPE352.model.response.AirQualityResponse;
import com.example.CMPE352.model.response.EnergyStatResponse;
import com.example.CMPE352.service.AirQualityService;
import com.example.CMPE352.model.response.NumberTriviaResponse;
import com.example.CMPE352.service.MotivationService;
import com.example.CMPE352.service.NumberService;
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
    private final EnergyStatsService energyStatsService;    

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

}
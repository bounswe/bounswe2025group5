package com.example.CMPE352.controller;


import com.example.CMPE352.model.response.AirQualityResponse;
import com.example.CMPE352.service.AirQualityService;
import com.example.CMPE352.service.MotivationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.CMPE352.model.response.MotivationalQuoteResponse;


@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomePageController {

    private final MotivationService motivationService;
    private final AirQualityService airQualityService;

    @GetMapping("/getMotivated")
    public ResponseEntity<MotivationalQuoteResponse> getMotivationalQuote() {
        MotivationalQuoteResponse quote = motivationService.fetchMotivationalQuote();
        return ResponseEntity.ok(quote);
    }

    @GetMapping("/getAirQuality")
    public AirQualityResponse getAirQuality(@RequestParam String location) {
        return airQualityService.getAirQualityData(location);
    }

}
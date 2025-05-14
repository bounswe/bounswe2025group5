package com.example.CMPE352.controller;


import com.example.CMPE352.model.response.EnergyStatResponse;
import com.example.CMPE352.service.EnergyStatsService;
import com.example.CMPE352.service.MotivationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.CMPE352.model.response.MotivationalQuoteResponse;

import java.util.List;


@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomePageController {

    private final MotivationService motivationService;
    private final EnergyStatsService energyStatsService;


    @GetMapping("/getMotivated")
    public ResponseEntity<MotivationalQuoteResponse> getMotivationalQuote() {
        MotivationalQuoteResponse quote = motivationService.fetchMotivationalQuote();
        return ResponseEntity.ok(quote);
    }

    @GetMapping("/energy/{countryCode}")
    public List<EnergyStatResponse> getEnergyStats(@PathVariable String countryCode) {
        return energyStatsService.fetchEnergyStats(countryCode);
    }


}
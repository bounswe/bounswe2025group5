package com.example.CMPE352.controller;

import com.example.CMPE352.model.response.EnergyStatResponse;
import com.example.CMPE352.service.EnergyStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/energy")
public class EnergyStatsController {

    @Autowired
    private EnergyStatsService energyStatsService;

    @GetMapping("/{countryCode}")
    public List<EnergyStatResponse> getEnergyStats(@PathVariable String countryCode) {
        return energyStatsService.fetchEnergyStats(countryCode);
    }
}


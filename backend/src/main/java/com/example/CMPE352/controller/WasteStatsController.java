package com.example.CMPE352.controller;

import com.example.CMPE352.model.response.WasteStatResponse;
import com.example.CMPE352.service.WasteStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/waste")
public class WasteStatsController {

    @Autowired
    private WasteStatsService wasteStatsService;

    @GetMapping("/{countryCode}")
    public WasteStatResponse getWasteStat(@PathVariable String countryCode) {
        return wasteStatsService.fetchWasteStat(countryCode);
    }
}

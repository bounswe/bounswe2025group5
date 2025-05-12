package com.example.CMPE352.controller;


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


    @GetMapping("/getMotivated")
    public ResponseEntity<MotivationalQuoteResponse> getMotivationalQuote() {
        MotivationalQuoteResponse quote = motivationService.fetchMotivationalQuote();
        return ResponseEntity.ok(quote);
    }

}
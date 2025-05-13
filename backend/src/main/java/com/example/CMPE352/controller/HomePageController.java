package com.example.CMPE352.controller;


import com.example.CMPE352.model.response.NumberTriviaResponse;
import com.example.CMPE352.service.MotivationService;
import com.example.CMPE352.service.NumberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.CMPE352.model.response.MotivationalQuoteResponse;



@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomePageController {

    private final MotivationService motivationService;
    private final NumberService numberService;

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





}
package com.example.CMPE352.controller;

import com.example.CMPE352.model.response.NumberTriviaResponse;
import com.example.CMPE352.service.NumberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/number")
@RequiredArgsConstructor
public class NumberController {

    private final NumberService numberService;

    @GetMapping("/{number}")
    public ResponseEntity<NumberTriviaResponse> getNumberTrivia(@PathVariable int number) {
        NumberTriviaResponse trivia = numberService.fetchNumberTrivia(number);
        return ResponseEntity.ok(trivia);
    }
}

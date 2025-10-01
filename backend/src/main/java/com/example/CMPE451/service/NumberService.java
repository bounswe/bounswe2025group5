package com.example.CMPE352.service;

import com.example.CMPE352.model.response.NumberTriviaResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class NumberService {

    private static final String NUMBERS_API_URL = "http://numbersapi.com";

    public NumberTriviaResponse fetchNumberTrivia(int number) {
        String url = NUMBERS_API_URL + "/" + number + "?json";
        RestTemplate rt = new RestTemplate();

        try {
            NumberTriviaResponse resp = rt.getForObject(url, NumberTriviaResponse.class);
            if (resp != null) {
                return resp;
            }
            log.warn("Numbers API returned null for {}", url);
        } catch (RestClientException e) {
            log.error("Numbers API call failed", e);
        }

        NumberTriviaResponse fallback = new NumberTriviaResponse();
        fallback.setText(number + " is a perfectly round number.");
        fallback.setNumber(number);
        fallback.setFound(false);
        fallback.setType("trivia");
        return fallback;
    }
}

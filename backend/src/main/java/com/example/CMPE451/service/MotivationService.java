package com.example.CMPE451.service;

import com.example.CMPE451.model.response.ZenQuoteExternalResponse;
import com.example.CMPE451.model.response.MotivationalQuoteResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MotivationService {

    private static final String ZEN_QUOTES_URL = "https://zenquotes.io/api/random";

    public MotivationalQuoteResponse fetchMotivationalQuote() {
        RestTemplate restTemplate = new RestTemplate();
        ZenQuoteExternalResponse[] quotes = restTemplate.getForObject(ZEN_QUOTES_URL, ZenQuoteExternalResponse[].class);

        if (quotes == null || quotes.length == 0) {
            // Handle error gracefully, return a default quote or throw an exception
            MotivationalQuoteResponse errorResponse = new MotivationalQuoteResponse();
            errorResponse.setQuote("Keep going, you're doing a really good job!");
            errorResponse.setAuthor("Wasteless Developers");
            return errorResponse;
        }
        ZenQuoteExternalResponse apiResponse = quotes[0];
        MotivationalQuoteResponse response = new MotivationalQuoteResponse();
        response.setQuote(apiResponse.getQuote());
        response.setAuthor(apiResponse.getAuthor());

        return response;
    }
}

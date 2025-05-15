package com.example.CMPE352.service;

import com.example.CMPE352.model.response.RandomFactExternalResponse;
import com.example.CMPE352.model.response.RandomFactResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RandomFactService {

    private static final String RANDOM_FACT_URL =
            "https://uselessfacts.jsph.pl/random.json?language=en";

    public RandomFactResponse fetchRandomFact() {
        RestTemplate restTemplate = new RestTemplate();
        RandomFactExternalResponse apiResponse =
                restTemplate.getForObject(RANDOM_FACT_URL, RandomFactExternalResponse.class);

        if (apiResponse == null) {
            RandomFactResponse error = new RandomFactResponse();
            error.setId("local-fallback");
            error.setText("Honey never spoils.");
            return error;
        }

        RandomFactResponse response = new RandomFactResponse();
        response.setId(apiResponse.getId());
        response.setText(apiResponse.getText());
        return response;
    }
}

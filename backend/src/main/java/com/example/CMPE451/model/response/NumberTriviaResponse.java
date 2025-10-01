package com.example.CMPE451.model.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class NumberTriviaResponse {
    private String text;
    private int    number;
    private boolean found;
    private String type;
}

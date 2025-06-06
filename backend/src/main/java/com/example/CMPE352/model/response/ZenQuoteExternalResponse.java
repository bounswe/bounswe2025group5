package com.example.CMPE352.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ZenQuoteExternalResponse {
    @JsonProperty("q")
    private String quote;

    @JsonProperty("a")
    private String author;
}

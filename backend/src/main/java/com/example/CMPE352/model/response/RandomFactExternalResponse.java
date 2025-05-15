package com.example.CMPE352.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class RandomFactExternalResponse {

    private String id;

    private String text;

    @JsonProperty("source")
    private String source;

    @JsonProperty("source_url")
    private String sourceUrl;

    private String language;

    private String permalink;
}

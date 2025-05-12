package com.example.CMPE352.model.wikidata;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WikidataSearchResponse {

    @JsonProperty("searchinfo")
    private SearchInfo searchInfo;

    @JsonProperty("search")
    private List<WikidataSearchResult> search;

    @JsonProperty("success")
    private int success;

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SearchInfo {
        @JsonProperty("search")
        private String search;
    }
}
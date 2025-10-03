package com.example.CMPE451.model.wikidata;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SparqlResultsContainer {
    private List<RelatedLabelBinding> bindings;
}
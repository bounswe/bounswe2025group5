package com.example.CMPE352.model.wikidata; // Use your correct package

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RelatedLabelBinding {

    @JsonProperty("relatedLabel")
    private SparqlBindingValue relatedLabel;


}
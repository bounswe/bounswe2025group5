package com.example.CMPE451.model.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class WorldBankResponse {
    private Indicator indicator;
    private Country country;
    private String date;
    private Double value;

    // Getters and setters

    public Indicator getIndicator() {
        return indicator;
    }

    public void setIndicator(Indicator indicator) {
        this.indicator = indicator;
    }

    public Country getCountry() {
        return country;
    }

    public void setCountry(Country country) {
        this.country = country;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Indicator {
        private String value;
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Country {
        private String value;
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }
}

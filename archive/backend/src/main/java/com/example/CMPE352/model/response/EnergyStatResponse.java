package com.example.CMPE352.model.response;

public class EnergyStatResponse {
    private String country;
    private String year;
    private Double value; // Waste % or kg per capita

    // Getters and setters
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }
}

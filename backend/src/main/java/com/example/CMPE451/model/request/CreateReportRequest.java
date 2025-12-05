package com.example.CMPE451.model.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateReportRequest {
    private String reporterName;
    private String description;
    private String type;
    private String contentType;
    private Integer objectId;
}
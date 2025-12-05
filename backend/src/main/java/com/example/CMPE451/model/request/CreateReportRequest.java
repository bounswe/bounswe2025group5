package com.example.CMPE451.model.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateReportRequest {
    private String username;
    private String content;
    private String type;
    private String contentType;
    private Integer objectId;
}
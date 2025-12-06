package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetReportResponse {
    private Integer id;
    private String reporterUsername;
    private String type;
    private String description;
    private Integer isSolved;
    private String contentType;
    private Integer objectId;
    private Timestamp createdAt;
}
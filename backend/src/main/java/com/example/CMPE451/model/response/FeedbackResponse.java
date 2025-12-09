package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FeedbackResponse {
    private Integer feedbackId;
    private String feedbackerUsername;
    private String contentType;
    private String content;
    private Timestamp createdAt;
}
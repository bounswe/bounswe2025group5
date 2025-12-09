package com.example.CMPE451.model.request;

import lombok.Data;

@Data
public class FeedbackRequest {
    private String feedbackerUsername;
    private String contentType;
    private String content;
}

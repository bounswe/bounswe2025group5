package com.example.CMPE451.model.response;

import lombok.Data;

import java.sql.Timestamp;

@Data
public class NotificationResponse {
    private Integer id;
    private String message;
    private Boolean isRead;
    private Timestamp createdAt;
}

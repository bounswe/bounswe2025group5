package com.example.CMPE451.model.response;

import lombok.Data;

import java.sql.Timestamp;

@Data
public class NotificationResponse {
    private Integer id;
    private String type;
    private String actorId;
    private Boolean isRead;
    private Timestamp createdAt;
    private String objectId;
    private String objectType;
    private String preview;
    private String profile_picture;
}

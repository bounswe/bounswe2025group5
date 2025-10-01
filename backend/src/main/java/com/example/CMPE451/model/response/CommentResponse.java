package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommentResponse {
    private Integer commentId;
    private String content;
    private Timestamp createdAt;
    private String creatorUsername;
}

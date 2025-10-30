package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
public class GetSavedPostResponse {
    private Integer  postId;
    private String   content;
    private Integer  likes;
    private Integer  comments;
    private String creatorUsername;
    private Timestamp savedAt;
    private String photoUrl;
    boolean liked;
    boolean saved;
}

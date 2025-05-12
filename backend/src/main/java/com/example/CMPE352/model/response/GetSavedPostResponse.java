package com.example.CMPE352.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
public class GetSavedPostResponse {
    private Integer  postId;
    private String   content;
    private Integer  likeCount;
    private Timestamp savedAt;
    private String photoUrl;
}

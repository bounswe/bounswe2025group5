package com.example.CMPE352.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetPostResponse {

    private Integer postId;
    private String content;
    private Timestamp createdAt;
    private Integer likes;
    private String creatorUsername;
    private String photoUrl;
    private Integer comments;
    private boolean liked;
    private boolean saved;
}

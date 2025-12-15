package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrEditPostResponse {
    private Integer postId;
    private String content;
    private Timestamp createdAt;
    private String creatorUsername;
    private String photoUrl;
    private String profile_picture;

}

package com.example.CMPE352.model.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class CommentRequest {
    private String username;
    private String content;
    private Integer postId;
}
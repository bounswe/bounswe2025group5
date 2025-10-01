package com.example.CMPE352.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetCommentsResponse {
    private Integer postId;
    private Integer totalComments;
    private List<CommentResponse> comments;
}
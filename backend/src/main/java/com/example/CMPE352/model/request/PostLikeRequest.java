package com.example.CMPE352.model.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostLikeRequest {
    private String Username;
    private Integer postId;
}
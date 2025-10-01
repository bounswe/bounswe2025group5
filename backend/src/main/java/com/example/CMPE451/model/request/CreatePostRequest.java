package com.example.CMPE451.model.request;


import lombok.Data;

@Data
public class CreatePostRequest {
    private String content;
    private String username;
}
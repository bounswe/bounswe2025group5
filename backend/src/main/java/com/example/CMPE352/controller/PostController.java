package com.example.CMPE352.controller;

import com.example.CMPE352.model.response.PostResponse;
import com.example.CMPE352.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<List<PostResponse>> getPosts(
            @RequestParam Long userId,
            @RequestParam int size,
            @RequestParam(required = false) Long lastPostId
    ) {
        List<PostResponse> posts = postService.getPosts(userId, size, lastPostId);
        return ResponseEntity.ok(posts);
    }
}

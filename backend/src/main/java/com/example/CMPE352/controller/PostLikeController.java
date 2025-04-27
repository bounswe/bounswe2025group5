package com.example.CMPE352.controller;

import com.example.CMPE352.model.request.PostLikeRequest;
import com.example.CMPE352.model.response.PostLikeResponse;
import com.example.CMPE352.service.PostLikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
public class PostLikeController {

    private final PostLikeService postLikeService;

    @Autowired
    public PostLikeController(PostLikeService postLikeService) {
        this.postLikeService = postLikeService;
    }

    @PostMapping("/like")
    public ResponseEntity<Void> addLike(@RequestBody PostLikeRequest request) {
        postLikeService.addLike(request.getUsername(), request.getPostId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/like")
    public ResponseEntity<Void> removeLike(@RequestBody PostLikeRequest request) {
        postLikeService.removeLike(request.getUsername(), request.getPostId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{postId}/likes")
    public ResponseEntity<PostLikeResponse> getPostLikes(@PathVariable Integer postId) {
        PostLikeResponse response = postLikeService.getPostLikes(postId);
        return ResponseEntity.ok(response);
    }
}
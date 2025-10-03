package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.PostLikeRequest;
import com.example.CMPE451.model.response.PostLikeResponse;
import com.example.CMPE451.service.PostLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostLikeController {

    private final PostLikeService postLikeService;

    @PostMapping("/like")
    public ResponseEntity<  Map<String, Boolean> > addLike(@RequestBody PostLikeRequest request) {
        Map<String, Boolean> response = postLikeService.addLike(request.getUsername(), request.getPostId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/like")
    public ResponseEntity<Map<String, Boolean>> removeLike(@RequestBody PostLikeRequest request) {
        Map<String, Boolean> response = postLikeService.removeLike(request.getUsername(), request.getPostId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{postId}/likes")
    public ResponseEntity<PostLikeResponse> getPostLikes(@PathVariable Integer postId) {
        PostLikeResponse response = postLikeService.getPostLikes(postId);
        return ResponseEntity.ok(response);
    }
}
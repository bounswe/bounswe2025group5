package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.CommentRequest;
import com.example.CMPE451.model.response.CommentResponse;
import com.example.CMPE451.model.response.GetCommentsResponse;
import com.example.CMPE451.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/posts/")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(@RequestBody CommentRequest request, @PathVariable Integer postId) {
        CommentResponse response = commentService.addComment(request, postId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<GetCommentsResponse> getCommentsForPost(@PathVariable Integer postId) {
        GetCommentsResponse getCommentsResponse= commentService.getCommentsForPost(postId);
        return ResponseEntity.ok(getCommentsResponse);
    }

    @PutMapping("/comment/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Integer commentId,
            @RequestBody CommentRequest request) {
        CommentResponse response = commentService.updateComment(commentId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/comment/{commentId}")
    public ResponseEntity<Map<String, Boolean>> deleteComment(
            @PathVariable Integer commentId) {
        Map<String, Boolean> response =commentService.deleteComment(commentId);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/comment/{commentId}")
    public ResponseEntity<CommentResponse> getComment(@PathVariable Integer commentId) {
        CommentResponse response =commentService.getComment(commentId);
        return ResponseEntity.ok(response);
    }
}
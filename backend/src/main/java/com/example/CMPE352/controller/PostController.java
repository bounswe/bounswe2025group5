package com.example.CMPE352.controller;

import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.request.CreatePostRequest;
import com.example.CMPE352.model.response.CreateOrEditPostResponse;
import com.example.CMPE352.model.response.DeletePostResponse;
import com.example.CMPE352.model.response.GetPostResponse;
import com.example.CMPE352.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping("/info")
    public ResponseEntity<List<GetPostResponse>> getPosts(
            @RequestParam int size,
            @RequestParam(required = false) Long lastPostId
    ) {
        List<GetPostResponse> posts = postService.getPosts(size, lastPostId);
        return ResponseEntity.ok(posts);
    }
    @PostMapping("/create")
    public ResponseEntity<CreateOrEditPostResponse> createPost(@RequestBody CreatePostRequest request) {
        CreateOrEditPostResponse response = postService.createPost(request);
        return ResponseEntity.ok(response);
    }
    @PutMapping("/edit/{postId}")
    public ResponseEntity<CreateOrEditPostResponse> editPost(
            @PathVariable Integer postId,
            @RequestBody Post editPostRequest) {
        CreateOrEditPostResponse updatedPostResponse = postService.editPost(postId, editPostRequest);

        return ResponseEntity.ok(updatedPostResponse);
    }

    @DeleteMapping("/delete/{postId}")
    public ResponseEntity<DeletePostResponse> deletePost(@PathVariable Integer postId) {
        postService.deletePost(postId);
        return ResponseEntity.ok(new DeletePostResponse(postId));
    }

}

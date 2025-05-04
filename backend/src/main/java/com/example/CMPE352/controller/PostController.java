package com.example.CMPE352.controller;

import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.request.CreatePostRequest;
import com.example.CMPE352.model.request.SavePostRequest;
import com.example.CMPE352.model.response.CreateOrEditPostResponse;
import com.example.CMPE352.model.response.GetSavedPostResponse;
import com.example.CMPE352.model.response.DeletePostResponse;
import com.example.CMPE352.model.response.GetPostResponse;
import com.example.CMPE352.model.response.SavePostResponse;
import com.example.CMPE352.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    @GetMapping("/mostLikedPosts")
    public ResponseEntity<List<GetPostResponse>> getMostLikedPosts(
            @RequestParam int size
    ) {
        List<GetPostResponse> posts = postService.getMostLikedPosts(size);
        return ResponseEntity.ok(posts);
    }

    @PostMapping(("/save"))
    public ResponseEntity<SavePostResponse> savePost(@RequestBody SavePostRequest request) {
        SavePostResponse response = postService.savePost(request);
        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/unsave{userId}/{postId}")
    public ResponseEntity<Map<String, Boolean>> deleteSavedPost(
            @PathVariable Integer userId,
            @PathVariable Integer postId) {
        Map<String, Boolean> response = postService.deleteSavedPost(userId, postId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getSavedPosts")
    public ResponseEntity<List<GetSavedPostResponse>> getSavedPosts(
            @RequestParam("userId") Integer userId
    ) {
        List<GetSavedPostResponse> savedPosts = postService.getSavedPosts(userId);
        return ResponseEntity.ok(savedPosts);
    }
}

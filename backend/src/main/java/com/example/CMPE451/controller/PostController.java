package com.example.CMPE451.controller;


import com.example.CMPE451.model.Post;
import com.example.CMPE451.model.request.SavePostRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<List<GetPostResponse>> getPosts(
            @RequestParam(required = false) String username,
            @RequestParam int size,
            @RequestParam(required = false) Long lastPostId
    ) {
        List<GetPostResponse> posts = postService.getPosts(username ,size, lastPostId);
        return ResponseEntity.ok(posts);
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<CreateOrEditPostResponse> createPost(
            @RequestParam(value = "content")String content,
            @RequestParam("username") String username,
            @RequestParam(value = "photoFile", required = false) MultipartFile photoFile) {
        CreateOrEditPostResponse response = postService.createPost(content,username, photoFile);
        return ResponseEntity.ok(response);
    }
    @PutMapping(value= "/{postId}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<CreateOrEditPostResponse> editPost(
            @PathVariable Integer postId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam("username") String username,
            @RequestParam(value = "photoFile", required = false) MultipartFile photoFile) {
        CreateOrEditPostResponse updatedPostResponse = postService.editPost(postId, content,username,photoFile);

        return ResponseEntity.ok(updatedPostResponse);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<DeletePostResponse> deletePost(@PathVariable Integer postId) {
        postService.deletePost(postId);
        return ResponseEntity.ok(new DeletePostResponse(postId));
    }
    @GetMapping("/mostLiked")
    public ResponseEntity<List<GetPostResponse>> getMostLikedPosts(
            @RequestParam(required = false) String username,
            @RequestParam int size

    ) {
        List<GetPostResponse> posts = postService.getMostLikedPosts(size,username);
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/{postId}/save")
    public ResponseEntity<SavePostResponse> savePost(
            @RequestBody SavePostRequest request,
            @PathVariable Integer postId) {
        SavePostResponse response = postService.savePost(request, postId);
        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/{postId}/saves/{username}")
    public ResponseEntity<Map<String, Boolean>> deleteSavedPost(
            @PathVariable String username,
            @PathVariable Integer postId) {
        Map<String, Boolean> response = postService.deleteSavedPost(username, postId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public List<Post> searchPosts(@RequestParam("q") String query) {
        return postService.semanticSearch(query);
    }
}

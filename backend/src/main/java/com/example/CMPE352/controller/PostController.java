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

    @GetMapping("/info")
    public ResponseEntity<List<GetPostResponse>> getPosts(
            @RequestParam(required = false) String username,
            @RequestParam int size,
            @RequestParam(required = false) Long lastPostId
    ) {
        List<GetPostResponse> posts = postService.getPosts(username ,size, lastPostId);
        return ResponseEntity.ok(posts);
    }
    @PostMapping(value = "/create", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<CreateOrEditPostResponse> createPost(
            @RequestParam(value = "content")String content,
            @RequestParam("username") String username,
            @RequestParam(value = "photoFile", required = false) MultipartFile photoFile) {
        CreateOrEditPostResponse response = postService.createPost(content,username, photoFile);
        return ResponseEntity.ok(response);
    }
    @PutMapping(value= "/edit/{postId}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<CreateOrEditPostResponse> editPost(
            @PathVariable Integer postId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam("username") String username,
            @RequestParam(value = "photoFile", required = false) MultipartFile photoFile) {
        CreateOrEditPostResponse updatedPostResponse = postService.editPost(postId, content,username,photoFile);

        return ResponseEntity.ok(updatedPostResponse);
    }

    @DeleteMapping("/delete/{postId}")
    public ResponseEntity<DeletePostResponse> deletePost(@PathVariable Integer postId) {
        postService.deletePost(postId);
        return ResponseEntity.ok(new DeletePostResponse(postId));
    }
    @GetMapping("/mostLikedPosts")
    public ResponseEntity<List<GetPostResponse>> getMostLikedPosts(
            @RequestParam(required = false) String username,
            @RequestParam int size

    ) {
        List<GetPostResponse> posts = postService.getMostLikedPosts(size,username);
        return ResponseEntity.ok(posts);
    }

    @PostMapping(("/save"))
    public ResponseEntity<SavePostResponse> savePost(@RequestBody SavePostRequest request) {
        SavePostResponse response = postService.savePost(request);
        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/unsave{username}/{postId}")
    public ResponseEntity<Map<String, Boolean>> deleteSavedPost(
            @PathVariable String username,
            @PathVariable Integer postId) {
        Map<String, Boolean> response = postService.deleteSavedPost(username, postId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getSavedPosts")
    public ResponseEntity<List<GetSavedPostResponse>> getSavedPosts(
            @RequestParam("username") String username
    ) {
        List<GetSavedPostResponse> savedPosts = postService.getSavedPosts(username);
        return ResponseEntity.ok(savedPosts);
    }

    @GetMapping("/getPostsForUser")
    public ResponseEntity<List<GetPostResponse>> getPostsForUser(
            @RequestParam("username") String username
    ) {
        List<GetPostResponse> postsForUser = postService.getPostsForUser(username);
        return ResponseEntity.ok(postsForUser);
    }
}

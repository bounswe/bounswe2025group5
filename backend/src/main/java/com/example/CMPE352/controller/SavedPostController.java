package com.example.CMPE352.controller;

import com.example.CMPE352.model.request.SavePostRequest;
import com.example.CMPE352.model.response.SavePostResponse;
import com.example.CMPE352.service.SavedPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/saved-posts")
@RequiredArgsConstructor
public class SavedPostController {

    private final SavedPostService savedPostService;

    @PostMapping
    public ResponseEntity<SavePostResponse> savePost(@RequestBody SavePostRequest request) {
        SavePostResponse response = savedPostService.savePost(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}/{postId}")
    public ResponseEntity<Map<String, Boolean>> deleteSavedPost(
            @PathVariable Integer userId,
            @PathVariable Integer postId) {
        Map<String, Boolean> response = savedPostService.deleteSavedPost(userId, postId);
        return ResponseEntity.ok(response);
    }

}

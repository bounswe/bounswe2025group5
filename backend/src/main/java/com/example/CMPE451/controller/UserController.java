package com.example.CMPE451.controller;

import com.example.CMPE451.model.response.*;
import com.example.CMPE451.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{username}/saved-posts")
    public ResponseEntity<List<GetSavedPostResponse>> getSavedPosts(
            @PathVariable String username
    ) {
        List<GetSavedPostResponse> savedPosts = userService.getSavedPosts(username);
        return ResponseEntity.ok(savedPosts);
    }

    @GetMapping("/{username}/posts")
    public ResponseEntity<List<GetPostResponse>> getPostsForUser(
            @PathVariable("username") String username
    ) {
        List<GetPostResponse> postsForUser = userService.getPostsForUser(username);
        return ResponseEntity.ok(postsForUser);
    }

    @GetMapping("/count")
    public ResponseEntity<UserCountResponse> getUserCount() {
        UserCountResponse count = userService.getUserCount();
        return ResponseEntity.ok(count);
    }
    @GetMapping("/users/{username}/challenges")
    public ResponseEntity<List<ChallengeListResponse>> getAllChallenges(
            @RequestParam("username") String username) {
        List<ChallengeListResponse> list = userService.getAllChallenges(username);
        return ResponseEntity.ok(list);
    }
    @GetMapping("/{username}/badges")
    public ResponseEntity<List<BadgeResponse>> getBadges(@RequestParam String username) {
        List<BadgeResponse> response = userService.getBadges(username);
        return ResponseEntity.ok(response);    }
}
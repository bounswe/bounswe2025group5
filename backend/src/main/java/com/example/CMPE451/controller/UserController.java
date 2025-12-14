package com.example.CMPE451.controller;

import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.model.request.DeleteUserRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
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

    @GetMapping("/{username}/badges")
    public ResponseEntity<List<BadgeResponse>> getBadges(@PathVariable("username") String username) {
        List<BadgeResponse> response = userService.getBadges(username);
        return ResponseEntity.ok(response);    }

    @DeleteMapping("/{username}")
    public ResponseEntity<UserDeleteResponse> deleteUser(
            @PathVariable String username,
            @RequestBody DeleteUserRequest request) {

        try {
            UserDeleteResponse response = userService.deleteUser(username, request);
            return ResponseEntity.ok(response);
        }
        catch ( InvalidCredentialsException e ) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
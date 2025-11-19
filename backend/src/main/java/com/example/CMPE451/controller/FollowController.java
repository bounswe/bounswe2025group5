package com.example.CMPE451.controller;

import com.example.CMPE451.model.response.FollowStatsResponse;
import com.example.CMPE451.model.response.FollowingFeatureResponse;
import com.example.CMPE451.model.response.GetFollowersResponse;
import com.example.CMPE451.model.response.GetFollowingsResponse;
import com.example.CMPE451.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;


    @GetMapping("/{username}/followers")
    public List<GetFollowersResponse> getFollowers(@PathVariable String username) {
        return followService.getFollowers(username);
    }


    @GetMapping("/{username}/followings")
    public List<GetFollowingsResponse> getFollowing(@PathVariable String username) {
        return followService.getFollowing(username);
    }




    @GetMapping("/{username}/follow-stats")
    public FollowStatsResponse getFollowStats(@PathVariable String username) {
        return followService.getFollowStats(username);
    }


    @PostMapping("/{followerUsername}/follow/{followingUserName}")
    public ResponseEntity<FollowingFeatureResponse> follow(@PathVariable String followerUsername, @PathVariable String followingUserName) {
        FollowingFeatureResponse followUserResponse= followService.followUser(followerUsername, followingUserName);
        return ResponseEntity.ok(followUserResponse);
    }


    @DeleteMapping("/{followerUsername}/unfollow/{followingUserName}")
    public ResponseEntity<FollowingFeatureResponse> unfollow(@PathVariable String followerUsername, @PathVariable String followingUserName) {
        FollowingFeatureResponse unFollowUserResponse=  followService.unfollowUser(followerUsername, followingUserName);
        return ResponseEntity.ok(unFollowUserResponse);    }
}
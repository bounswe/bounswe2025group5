package com.example.CMPE451.service;

import com.example.CMPE451.exception.AlreadyExistsException;
import com.example.CMPE451.exception.ConflictException;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.Follow;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.FollowStatsResponse;
import com.example.CMPE451.model.response.FollowingFeatureResponse;
import com.example.CMPE451.model.response.GetFollowersResponse;
import com.example.CMPE451.model.response.GetFollowingsResponse;
import com.example.CMPE451.repository.FollowRepository;
import com.example.CMPE451.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final ActivityLogger activityLogger;


    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));
    }

    @Transactional
    public FollowingFeatureResponse followUser(String followerUser, String followingUser) {
        User follower = findUserByUsername(followerUser);
        User following = findUserByUsername(followingUser);
        if (followerUser.equals(followingUser)) {
            throw new ConflictException("A user cannot follow himself/herself.");
        }
        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new AlreadyExistsException("User " + followerUser + " already follows " + followingUser);
        }

        Follow follow = new Follow(follower, following);
        followRepository.saveAndFlush(follow);
        Integer newFollowerCount = followRepository.countByFollowing(following);

        activityLogger.logAction(
                "Follow",
                "User", follower.getUsername(),
                "User", follower.getUsername(),
                "User", following.getUsername()
        );

        return new FollowingFeatureResponse(followerUser,followingUser,newFollowerCount);
    }

    @Transactional
    public FollowingFeatureResponse unfollowUser(String followerUsername, String followingUserName) {
        User follower = findUserByUsername(followerUsername);
        User following = findUserByUsername(followingUserName);

        Follow follow = followRepository.findByFollowerAndFollowing(follower, following)
                .orElseThrow(() -> new NotFoundException("Follow relationship not found."));

        followRepository.delete(follow);
        followRepository.flush();
        Integer newFollowerCount = followRepository.countByFollowing(following);

        return new FollowingFeatureResponse(followerUsername,followingUserName, newFollowerCount);


    }

    public List<GetFollowersResponse> getFollowers(String username) {
        User user = findUserByUsername(username);

        return followRepository.findAllByFollowing(user).stream()
                .map(follow -> new GetFollowersResponse(follow.getFollower()))
                .collect(Collectors.toList());
    }

    public List<GetFollowingsResponse> getFollowing(String username) {
        User user = findUserByUsername(username);

        return followRepository.findAllByFollower(user).stream()
                .map(follow -> new GetFollowingsResponse(follow.getFollowing()))
                .collect(Collectors.toList());
    }

    public FollowStatsResponse getFollowStats(String username) {
        User user = findUserByUsername(username);

        Integer followersCount = followRepository.countByFollowing(user);
        Integer followingCount = followRepository.countByFollower(user);

        return new FollowStatsResponse(followersCount, followingCount);
    }

    public boolean isFollowing(String followerUsername, String followingUsername) {
        User follower = findUserByUsername(followerUsername);
        User following = findUserByUsername(followingUsername);

        return followRepository.existsByFollowerAndFollowing(follower, following);
    }
}
package com.example.CMPE451.service;

import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.Badge;
import com.example.CMPE451.model.Post;
import com.example.CMPE451.model.SavedPost;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.request.DeletePostRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ChallengeRepository  challengeRepository;
    private final BadgeRepository badgeRepository;
    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    public UserCountResponse getUserCount() {
        long count = userRepository.countAllUsers();
        return  new UserCountResponse(count);
    }

    public List<GetSavedPostResponse> getSavedPosts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        List<SavedPost> savedPosts =
                savedPostRepository.findAllByUserIdOrderBySavedAtDesc(user.getId());

        List<Integer> postIds = savedPosts.stream()
                .map(sp -> sp.getPost().getPostId())
                .toList();

        Set<Integer> likedPostIds = postLikeRepository.findLikedPostIdsByUserIdAndPostIdIn(
                user.getId(), postIds
        );

        return savedPosts.stream()
                .map(sp -> {
                    Post post = sp.getPost();
                    boolean isLiked = likedPostIds.contains(post.getPostId());
                    return new GetSavedPostResponse(
                            post.getPostId(),
                            post.getContent(),
                            post.getLikes(),
                            post.getComments(),
                            post.getUser().getUsername(),
                            sp.getSavedAt(),
                            post.getPhotoUrl(),
                            isLiked,
                            true
                    );
                })
                .collect(Collectors.toList());
    }


    public List<GetPostResponse> getPostsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        List<Post> posts = postRepository.findByUserId(user.getId());

        return convertToGetPostsResponse(posts, user.getId());
    }

    public List<BadgeResponse> getBadges(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        List<Badge> badges = badgeRepository.findByUserId(user.getId());

        return badges.stream()
                .map(badge -> new BadgeResponse(user.getUsername(), badge.getId().getName()))
                .toList();
    }

    public UserDeleteResponse deleteUser(String username, DeletePostRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid password");
        }

        UserDeleteResponse response = new UserDeleteResponse(user.getId(), username);

        userRepository.delete(user);

        return response;
    }

    private List<GetPostResponse> convertToGetPostsResponse(List<Post> posts, Integer requestingUserId) {
        if (posts.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> postIds = posts.stream().map(Post::getPostId).collect(Collectors.toList());

        Set<Integer> likedPostIds;
        Set<Integer> savedPostIds;

        if (requestingUserId != null) {
            likedPostIds = postLikeRepository.findLikedPostIdsByUserIdAndPostIdIn(requestingUserId, postIds);
            savedPostIds = savedPostRepository.findSavedPostIdsByUserIdAndPostIdIn(requestingUserId, postIds);
        } else {
            savedPostIds = Collections.emptySet();
            likedPostIds = Collections.emptySet();
        }

        return posts.stream()
                .map(post -> {
                    GetPostResponse postResponse = new GetPostResponse();
                    postResponse.setPostId(post.getPostId());
                    postResponse.setContent(post.getContent());
                    postResponse.setCreatedAt(post.getCreatedAt());
                    postResponse.setLikes(post.getLikes());
                    postResponse.setCreatorUsername(post.getUser().getUsername());
                    postResponse.setComments(post.getComments());
                    postResponse.setPhotoUrl(post.getPhotoUrl());
                    postResponse.setLiked(likedPostIds.contains(post.getPostId()));
                    postResponse.setSaved(savedPostIds.contains(post.getPostId()));
                    return postResponse;
                })
                .collect(Collectors.toList());
    }
}
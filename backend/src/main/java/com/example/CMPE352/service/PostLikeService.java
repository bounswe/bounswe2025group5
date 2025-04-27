package com.example.CMPE352.service;

import com.example.CMPE352.exception.AlreadyExistsException;
import com.example.CMPE352.exception.InvalidCredentialsException;
import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.PostLike;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.response.PostLikeResponse;
import com.example.CMPE352.model.response.UserResponse;
import com.example.CMPE352.repository.PostLikeRepository;
import com.example.CMPE352.repository.PostRepository;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostLikeService {
    private final PostLikeRepository postLikeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;


    @Transactional
    public Map<String, Boolean> addLike(String username, Integer postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidCredentialsException("User not found with username: " + username));

        postRepository.findById(postId)
                .orElseThrow(() -> new InvalidCredentialsException("Post not found with id: " + postId));

        if (postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new AlreadyExistsException("This post is already liked by " + user.getUsername());
        }
        PostLike like = new PostLike(user.getId(), postId);
        postLikeRepository.save(like);
        return Map.of("success", true);
    }

    @Transactional
    public Map<String, Boolean>  removeLike(String username, Integer postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidCredentialsException("User not found with username: " + username));
        if (!postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new InvalidCredentialsException("Like not found for this post by user : " + username);
        }
        postLikeRepository.deleteByUserIdAndPostId(user.getId(), postId);
        postRepository.findById(postId)
                .orElseThrow(() -> new InvalidCredentialsException("Post not found with id: " + postId));
        return Map.of("success", true);
    }

    public PostLikeResponse getPostLikes(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new InvalidCredentialsException("Post not found with id: " + postId));

        List<PostLike> likes = postLikeRepository.findByPostId(postId);

        List<UserResponse> likedByUsers = likes.stream()
                .map(like -> {
                    User user = userRepository.findById(like.getUserId())
                            .orElseThrow(() -> new InvalidCredentialsException("User not found with  id : " + like.getUserId()));
                    return new UserResponse(
                            user.getId(),
                            user.getUsername()
                    );
                })
                .collect(Collectors.toList());

        return new PostLikeResponse(
                postId,
                post.getLikes(),
                likedByUsers
        );
    }
}
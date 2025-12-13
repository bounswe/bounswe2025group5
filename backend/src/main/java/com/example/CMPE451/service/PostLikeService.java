package com.example.CMPE451.service;

import com.example.CMPE451.exception.AlreadyExistsException;
import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.model.Post;
import com.example.CMPE451.model.PostLike;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.PostLikeResponse;
import com.example.CMPE451.model.response.UserResponse;
import com.example.CMPE451.repository.PostLikeRepository;
import com.example.CMPE451.repository.PostRepository;
import com.example.CMPE451.repository.UserRepository;
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
    private final ActivityLogger activityLogger;


    @Transactional
    public Map<String, Boolean> addLike(String username, Integer postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidCredentialsException("User not found with username: " + username));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new InvalidCredentialsException("Post not found with id: " + postId));

        if (postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new AlreadyExistsException("This post is already liked by " + user.getUsername());
        }
        PostLike like = new PostLike(user.getId(), postId);
        postLikeRepository.save(like);

        String preview = null;
        if (post.getPhotoUrl() != null) {
            preview = post.getPhotoUrl();
        }
        else preview = post.getContent();

        activityLogger.logAction(
                "Like",
                "User", user.getUsername(),
                "Post", post.getPostId(),
                "User", post.getUser().getUsername(),
                getFirst255Characters(preview)

        );

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

    public static String getFirst255Characters(String text) {
        if (text == null) {
            return null;
        }

        int maxLength = 255;

        if (text.length() > maxLength) {
            return text.substring(0, maxLength);
        } else {
            return text;
        }
    }
}
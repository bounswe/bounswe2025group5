package com.example.CMPE352.service;

import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.PostLike;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.request.PostLikeRequest;
import com.example.CMPE352.model.response.PostLikeResponse;
import com.example.CMPE352.model.response.UserResponse;
import com.example.CMPE352.repository.PostLikeRepository;
import com.example.CMPE352.repository.PostRepository;
import com.example.CMPE352.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostLikeService {

    private final PostLikeRepository postLikeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Autowired
    public PostLikeService(PostLikeRepository postLikeRepository,
                           PostRepository postRepository,
                           UserRepository userRepository) {
        this.postLikeRepository = postLikeRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void addLike(String username, Integer postId) {
        // Find user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        // Verify post exists
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        // Check for existing like
        if (postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new RuntimeException("User already liked this post");
        }

        // Create and save the like
        PostLike like = new PostLike(user.getId(), postId);
        postLikeRepository.save(like);

        postRepository.save(post);
    }

    @Transactional
    public void removeLike(String username, Integer postId) {
        // Find user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        // Verify like exists
        if (!postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new RuntimeException("Like not found for user and post");
        }

        // Delete the like
        postLikeRepository.deleteByUserIdAndPostId(user.getId(), postId);

        // Update like count (if not using triggers)
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        postRepository.save(post);
    }

    public PostLikeResponse getPostLikes(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        List<PostLike> likes = postLikeRepository.findByPostId(postId);

        List<UserResponse> likedByUsers = likes.stream()
                .map(like -> {
                    User user = userRepository.findById(like.getUserId())
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    return new UserResponse(
                            user.getId(),
                            user.getUsername(),
                            user.getEmail()
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
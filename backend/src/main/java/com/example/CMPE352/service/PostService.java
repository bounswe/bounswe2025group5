package com.example.CMPE352.service;

import com.example.CMPE352.exception.AlreadyExistsException;
import com.example.CMPE352.exception.NotFoundException;
import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.Comment;
import com.example.CMPE352.model.SavedPost;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.request.CreatePostRequest;
import com.example.CMPE352.model.request.SavePostRequest;
import com.example.CMPE352.model.response.CreateOrEditPostResponse;
import com.example.CMPE352.model.response.GetPostResponse;
import com.example.CMPE352.model.response.CommentResponse;
import com.example.CMPE352.model.response.GetSavedPostResponse;
import com.example.CMPE352.model.response.SavePostResponse;
import com.example.CMPE352.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final SavedPostRepository savedPostRepository;


    public List<GetPostResponse> getPosts(String requestingUsername, int size, Long lastPostId) {
        Integer requestingUserId = null;
        if (requestingUsername != null) {
            User requestingUser = userRepository.findByUsername(requestingUsername)
                    .orElseThrow(() -> new NotFoundException("User not found: " + requestingUsername));
            requestingUserId = requestingUser.getId();
        }
        List<Post> posts = postRepository.findTopPosts(lastPostId, PageRequest.of(0, size));
        return convertToGetPostsResponse(posts, requestingUserId);
    }

    private List<CommentResponse> getCommentsForPost(Integer postId) {
        List<Comment> comments = commentRepository.findByPostPostId(postId);
        return comments.stream()
                .map(comment -> new CommentResponse(
                        comment.getCommentId(),
                        comment.getContent(),
                        comment.getCreatedAt(),
                        comment.getUser().getUsername()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public CreateOrEditPostResponse createPost(CreatePostRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("User not found: " + request.getUsername()));

        Post post = new Post(
                user,
                request.getContent(),
                request.getPhotoUrl(),
                0,
                0
        );
        post.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        postRepository.save(post);

        return new CreateOrEditPostResponse(
                post.getPostId(),
                post.getContent(),
                post.getCreatedAt(),
                post.getUser().getUsername()
        );
    }

    @Transactional
    public CreateOrEditPostResponse editPost(Integer postId, Post editPostRequest) {
        Optional<Post> existingPostOpt = postRepository.findById(postId);

        if (existingPostOpt.isEmpty()) {
            throw new NotFoundException("Post not found: " + postId);
        }

        Post existingPost = existingPostOpt.get();
        if (editPostRequest.getContent() != null) {
            existingPost.setContent(editPostRequest.getContent());
        }
        existingPost.setPhotoUrl(editPostRequest.getPhotoUrl());
        Post updatedPost = postRepository.saveAndFlush(existingPost);

        return new CreateOrEditPostResponse(
                updatedPost.getPostId(),
                updatedPost.getContent(),
                updatedPost.getCreatedAt(),
                updatedPost.getUser().getUsername()
        );
    }

    @Transactional
    public void deletePost(Integer postId) {
        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Post with ID " + postId + " not found.");
        }
        postRepository.deleteById(postId);

    }

    public List<GetPostResponse> getMostLikedPosts(Integer size, String username) {
        Integer userId = null;
        if (username != null) {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new NotFoundException("User not found: " + username));
            userId = user.getId();
        }

        List<Post> posts = postRepository.findMostLikedPosts(PageRequest.of(0, size));
        return convertToGetPostsResponse(posts, userId);
    }


    @Transactional
    public SavePostResponse savePost(SavePostRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new NotFoundException("User not found: " + request.getUserId())
                );
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() ->
                        new NotFoundException("Post not found: " + request.getPostId())
                );

        SavedPost saved = new SavedPost(request.getUserId(), request.getPostId());
        if (savedPostRepository.existsById(new SavedPost.SavedPostId(saved.getUserId(), saved.getPostId()))) {
            throw new AlreadyExistsException("This post is already saved by user" + user.getUsername());
        }
        savedPostRepository.save(saved);

        return new SavePostResponse(
                saved.getUserId(),
                saved.getPostId()
        );
    }

    @Transactional
    public Map<String, Boolean> deleteSavedPost(Integer userId, Integer postId) {
        SavedPost.SavedPostId id = new SavedPost.SavedPostId(userId, postId);
        if (!savedPostRepository.existsById(id)) {
            throw new NotFoundException(
                    "Saved‐post entry not found for userId=" + userId + ", postId=" + postId
            );
        }
        savedPostRepository.deleteById(id);
        return Map.of("deleted", true);
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
    
    public List<GetSavedPostResponse> getSavedPosts(Integer userId) {
        List<SavedPost> savedPosts =
                savedPostRepository.findAllByUserIdOrderBySavedAtDesc(userId);
        return savedPosts.stream()
                .map(sp -> new GetSavedPostResponse(
                        sp.getPost().getPostId(),
                        sp.getPost().getContent(),
                        sp.getPost().getLikes(),
                        sp.getSavedAt()))
                .collect(Collectors.toList());
    }

}


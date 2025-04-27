package com.example.CMPE352.service;

import com.example.CMPE352.exception.NotFoundException;
import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.Comment;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.request.CreatePostRequest;
import com.example.CMPE352.model.response.CreateOrEditPostResponse;
import com.example.CMPE352.model.response.GetPostResponse;
import com.example.CMPE352.model.response.CommentResponse;
import com.example.CMPE352.repository.PostRepository;
import com.example.CMPE352.repository.CommentRepository;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public List<GetPostResponse> getPosts(int size, Long lastPostId) {
        List<Post> posts = postRepository.findTopPosts(lastPostId, PageRequest.of(0, size));
        return convertToGetPostsResponse(posts);
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

    public List<GetPostResponse> getMostLikedPosts(Integer size) {
        List<Post> posts = postRepository.findMostLikedPosts(PageRequest.of(0, size));

        return convertToGetPostsResponse(posts);
    }

    private List<GetPostResponse> convertToGetPostsResponse(List<Post> posts) {
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
                    return postResponse;
                })
                .collect(Collectors.toList());
    }
}

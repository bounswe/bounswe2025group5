package com.example.CMPE352.service;

import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.Comment;
import com.example.CMPE352.model.response.PostResponse;
import com.example.CMPE352.model.response.CommentResponse;
import com.example.CMPE352.repository.PostRepository;
import com.example.CMPE352.repository.CommentRepository;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public List<PostResponse> getPosts(Long userId, int size, Long lastPostId) {
        // Fetch the most recent posts (or those after a specific postId)
        List<Post> posts = postRepository.findTopPosts(lastPostId, PageRequest.of(0, size));

        return posts.stream()
                .map(post -> {
                    PostResponse postResponse = new PostResponse();
                    postResponse.setPostId(post.getPostId());
                    postResponse.setContent(post.getContent());
                    postResponse.setCreatedAt(post.getCreatedAt());
                    postResponse.setLikes(post.getLikes());
                    postResponse.setCreatorUsername(post.getUser().getUsername());
                    postResponse.setComments(getCommentsForPost(post.getPostId()));
                    return postResponse;
                })
                .collect(Collectors.toList());
    }

    private List<CommentResponse> getCommentsForPost(Integer postId) {
        List<Comment> comments = commentRepository.findByPostPostId(postId);
        return comments.stream()
                .map(comment -> new CommentResponse(
                        comment.getContent(),
                        comment.getCreatedAt(),
                        comment.getUser().getUsername()
                ))
                .collect(Collectors.toList());
    }
}

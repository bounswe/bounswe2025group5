package com.example.CMPE352.service;

import com.example.CMPE352.exception.InvalidCredentialsException;
import com.example.CMPE352.model.Comment;
import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.request.CommentRequest;
import com.example.CMPE352.model.response.CommentResponse;
import com.example.CMPE352.repository.CommentRepository;
import com.example.CMPE352.repository.PostRepository;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;


    @Transactional
    public CommentResponse addComment(CommentRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("User not found with username: " + request.getUsername()));

        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new InvalidCredentialsException("Post not found with id: " + request.getPostId()));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(request.getContent());
        comment.setCreatedAt(Timestamp.from(Instant.now()));

        Comment savedComment = commentRepository.save(comment);

        return convertToResponse(savedComment);
    }

    @Transactional
    public CommentResponse updateComment(Integer commentId, CommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new InvalidCredentialsException("Comment not found with id: " + commentId));

        comment.setContent(request.getContent());
        Comment updatedComment = commentRepository.save(comment);

        return convertToResponse(updatedComment);
    }

    @Transactional
    public Map<String, Boolean>  deleteComment(Integer commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new InvalidCredentialsException("Comment not found with id: " + commentId));
        commentRepository.delete(comment);
        return Map.of("success", true);
    }

    public List<CommentResponse> getCommentsForPost(Integer postId) {
        List<Comment> comments = commentRepository.findByPostPostId(postId);
        return comments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse convertToResponse(Comment comment) {
        return new CommentResponse(
                comment.getCommentId(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUser().getUsername()
        );
    }
}
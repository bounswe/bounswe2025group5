package com.example.CMPE352.service;

import com.example.CMPE352.model.Comment;
import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.request.CommentRequest;
import com.example.CMPE352.model.response.CommentResponse;
import com.example.CMPE352.repository.CommentRepository;
import com.example.CMPE352.repository.PostRepository;
import com.example.CMPE352.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Autowired
    public CommentService(CommentRepository commentRepository,
                          PostRepository postRepository,
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentResponse addComment(CommentRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found with username: " + request.getUsername()));

        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + request.getPostId()));

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
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        comment.setContent(request.getContent());
        Comment updatedComment = commentRepository.save(comment);

        return convertToResponse(updatedComment);
    }

    @Transactional
    public void deleteComment(Integer commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));


        commentRepository.delete(comment);
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
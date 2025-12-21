package com.example.CMPE451.service;

import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.model.Comment;
import com.example.CMPE451.model.Post;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.request.CommentRequest;
import com.example.CMPE451.model.response.CommentResponse;
import com.example.CMPE451.model.response.GetCommentsResponse;
import com.example.CMPE451.repository.CommentRepository;
import com.example.CMPE451.repository.PostRepository;
import com.example.CMPE451.repository.UserRepository;
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
    private final ActivityLogger activityLogger;



    @Transactional
    public CommentResponse addComment(CommentRequest request, Integer postId) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("User not found with username: " + request.getUsername()));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new InvalidCredentialsException("Post not found with id: " + postId));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(request.getContent());
        comment.setCreatedAt(Timestamp.from(Instant.now()));

        Comment savedComment = commentRepository.save(comment);

        activityLogger.logAction(
                "Create",
                "User", user.getUsername(),
                "Comment", postId,
                "User", post.getUser().getUsername(),
                getFirst255Characters(request.getContent()), user.getProfile().getPhotoUrl()
        );

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

    public GetCommentsResponse getCommentsForPost(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new InvalidCredentialsException("Post not found with id: " + postId));

        List<Comment> comments = commentRepository.findByPostPostId(postId);

        List<CommentResponse> commentResponses = comments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new GetCommentsResponse(
                postId,
                post.getComments(),
                commentResponses
        );
    }

    public CommentResponse getComment(Integer commentId) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new InvalidCredentialsException("Comment not found with id: " + commentId));;
        return new CommentResponse(
                commentId,
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUser().getUsername()
        );
    }
    private CommentResponse convertToResponse(Comment comment) {
        return new CommentResponse(
                comment.getCommentId(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUser().getUsername()
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
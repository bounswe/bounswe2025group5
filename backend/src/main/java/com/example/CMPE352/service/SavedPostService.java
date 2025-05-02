package com.example.CMPE352.service;

import com.example.CMPE352.exception.NotFoundException;
import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.SavedPost;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.request.SavePostRequest;
import com.example.CMPE352.model.response.SavePostResponse;
import com.example.CMPE352.repository.PostRepository;
import com.example.CMPE352.repository.SavedPostRepository;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

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
        saved = savedPostRepository.save(saved);

        return new SavePostResponse(
                saved.getUserId(),
                saved.getPostId(),
                saved.getSavedAt()
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
}

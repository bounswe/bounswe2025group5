package com.example.CMPE451.service;

import com.example.CMPE451.exception.AlreadyExistsException;
import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.exception.UploadFailedException;
import com.example.CMPE451.model.Post;
import com.example.CMPE451.model.Comment;
import com.example.CMPE451.model.SavedPost;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.request.CommentRequest;
import com.example.CMPE451.model.request.CreatePostRequest;
import com.example.CMPE451.model.request.SavePostRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;


import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;
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

    private final ActivityLogger activityLogger;

    private final EmbeddingService embeddingService;
    private final VectorDBService vectorDBService;
    private final FollowService followService;

    private final S3Client s3Client;

    @Value("${digitalocean.spaces.bucket-name}")
    private String bucketName;

    @Value("${digitalocean.spaces.region}")
    private String region;

    @Value("${digitalocean.spaces.post-photo-folder}")
    private String postPhotoFolder;



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
    public CreateOrEditPostResponse createPost(String content, String username, MultipartFile photoFile) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        String photoUrl = null;
        if (photoFile != null && !photoFile.isEmpty()) {
            photoUrl = uploadFileToSpaces(photoFile, postPhotoFolder);
        }

        Post post = new Post(
                user,
                content,
                photoUrl,
                0,
                0
        );
        post.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        Post savedPost = postRepository.saveAndFlush(post);

        try {
            float[] vector = embeddingService.createEmbedding(savedPost.getContent());
            vectorDBService.upsertVector(savedPost.getPostId(), vector);
        } catch (Exception e) {
            System.err.println("Failed to create embedding for post " + savedPost.getPostId() + ": " + e.getMessage());
        }

        List<String> followerUsernames = followService.getFollowers(username)
                .stream()
                .map(GetFollowersResponse::getUsername)
                .toList();

        activityLogger.logAction(
                "Create",
                "User", user.getUsername(),
                "Post", savedPost.getPostId(),
                "Users", followerUsernames
        );

        return new CreateOrEditPostResponse(
                post.getPostId(),
                post.getContent(),
                post.getCreatedAt(),
                post.getUser().getUsername(),
                post.getPhotoUrl()
        );
    }



    @Transactional
    public CreateOrEditPostResponse editPost(Integer postId,String content,String username, MultipartFile photoFile ) {
        Optional<Post> existingPostOpt = postRepository.findById(postId);

        if (existingPostOpt.isEmpty()) {
            throw new NotFoundException("Post not found: " + postId);
        }

        Post existingPost = existingPostOpt.get();
        if (content!= null) {
            existingPost.setContent(content);
        }
        if (photoFile != null && !photoFile.isEmpty()) {
            String photoUrl = uploadFileToSpaces(photoFile, postPhotoFolder);
            existingPost.setPhotoUrl(photoUrl);
        }
        Post updatedPost = postRepository.saveAndFlush(existingPost);
        boolean contentChanged = false;
        if (content != null && !content.equals(existingPost.getContent())) {
            existingPost.setContent(content);
            contentChanged = true;
        }
        if (contentChanged) {
            System.out.println("Content changed for post " + postId + ". Updating vector in Qdrant...");
            try {
                float[] newVector = embeddingService.createEmbedding(updatedPost.getContent());
                vectorDBService.upsertVector(updatedPost.getPostId(), newVector);
                System.out.println("Vector updated successfully for post " + postId);
            } catch (Exception e) {
                System.err.println("CRITICAL: Failed to update Qdrant vector for post "
                        + updatedPost.getPostId() + ". Search index is now stale.");
            }
        }
        return new CreateOrEditPostResponse(
                updatedPost.getPostId(),
                updatedPost.getContent(),
                updatedPost.getCreatedAt(),
                updatedPost.getUser().getUsername(),
                updatedPost.getPhotoUrl()
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
    public SavePostResponse savePost(SavePostRequest request, Integer postId) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() ->
                        new NotFoundException("User not found: " + request.getUsername())
                );
        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new NotFoundException("Post not found: " + postId)
                );

        SavedPost saved = new SavedPost(user.getId(), postId);
        if (savedPostRepository.existsById(new SavedPost.SavedPostId(saved.getUserId(), saved.getPostId()))) {
            throw new AlreadyExistsException("This post is already saved by user" + user.getUsername());
        }
        savedPostRepository.save(saved);

        return new SavePostResponse(
                request.getUsername(),
                saved.getPostId()
        );
    }

    @Transactional
    public Map<String, Boolean> deleteSavedPost(String username, Integer postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new NotFoundException("User not found: " + username)
                );
        SavedPost.SavedPostId id = new SavedPost.SavedPostId(user.getId(), postId);
        if (!savedPostRepository.existsById(id)) {
            throw new NotFoundException(
                    "Saved‐post entry not found for userId=" + user.getId() + ", postId=" + postId
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

    private String uploadFileToSpaces(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            return null;
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFileName = UUID.randomUUID().toString() + extension;
        String objectKey = folder + "/" + uniqueFileName;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .contentType(file.getContentType())
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            return String.format("https://%s.%s.digitaloceanspaces.com/%s",
                    bucketName, region, objectKey);
        } catch (IOException e) {
            throw new UploadFailedException("Failed to read file data for upload: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new UploadFailedException("Failed to upload photo to DigitalOcean Spaces: " + e.getMessage(), e);
        }
    }

    public List<GetPostResponse> semanticSearch(String query,String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        float[] queryVector = embeddingService.createEmbedding(query);

        List<Integer> postIds = vectorDBService.search(queryVector, 5);

        if (postIds.isEmpty()) {
            return List.of();
        }
        List<Post> posts = postRepository.findAllById(postIds);
        return convertToGetPostsResponse(posts, user.getId());
    }



}


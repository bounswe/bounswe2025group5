package com.example.CMPE352.repository;

import com.example.CMPE352.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikeId> {

    // Check if a user has already liked a post
    boolean existsByUserIdAndPostId(Integer userId, Integer postId);

    // Remove a like by a specific user for a specific post
    void deleteByUserIdAndPostId(Integer userId, Integer postId);

    // Get all users who liked a specific post
    List<PostLike> findByPostId(Integer postId);

    // Get a specific like by a user for a post
    PostLike findByUserIdAndPostId(Integer userId, Integer postId);

}

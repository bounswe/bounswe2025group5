package com.example.CMPE451.repository;

import com.example.CMPE451.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Integer> {

    @Query("""
    SELECT p FROM Post p
    WHERE (:lastPostId IS NULL OR p.createdAt < 
        (SELECT sub.createdAt FROM Post sub WHERE sub.postId = :lastPostId))
    ORDER BY p.createdAt DESC
    """)
    List<Post> findTopPosts(@Param("lastPostId") Long lastPostId, Pageable pageable);

    @Query("SELECT p FROM Post p ORDER BY p.likes DESC")
    List<Post> findMostLikedPosts(Pageable pageable);

    Post findByPostId(Integer postId);

    List<Post> findByUserId(Integer userId);

    List<Post> findByContentContainingIgnoreCase(String searchTerm);



}

package com.example.CMPE352.repository;

import com.example.CMPE352.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {

    // Fetch comments by postId (to retrieve all comments for a specific post)
    List<Comment> findByPostPostId(Integer postId);
}

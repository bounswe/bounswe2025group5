package com.example.CMPE352.repository;

import com.example.CMPE352.model.SavedPost;
import com.example.CMPE352.model.SavedPost.SavedPostId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, SavedPostId> {

    List<SavedPost> findByUserId(Integer userId);
    List<SavedPost> findByPostId(Integer postId);
    List<SavedPost> findAllByUserIdOrderBySavedAtDesc(Integer userId);
}


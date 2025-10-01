package com.example.CMPE451.repository;

import com.example.CMPE451.model.SavedPost;
import com.example.CMPE451.model.SavedPost.SavedPostId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, SavedPostId> {

    List<SavedPost> findByUserId(Integer userId);
    List<SavedPost> findByPostId(Integer postId);
    List<SavedPost> findAllByUserIdOrderBySavedAtDesc(Integer userId);
    @Query("SELECT sp.postId FROM SavedPost sp WHERE sp.userId = :userId AND sp.postId IN :postIds")
    Set<Integer> findSavedPostIdsByUserIdAndPostIdIn(@Param("userId") Integer userId, @Param("postIds") Collection<Integer> postIds);
}

package com.example.CMPE451.repository;

import com.example.CMPE451.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikeId> {

    boolean existsByUserIdAndPostId(Integer userId, Integer postId);

    void deleteByUserIdAndPostId(Integer userId, Integer postId);

    List<PostLike> findByPostId(Integer postId);

    PostLike findByUserIdAndPostId(Integer userId, Integer postId);

    @Query("SELECT pl.postId FROM PostLike pl WHERE pl.userId = :userId AND pl.postId IN :postIds")
    Set<Integer> findLikedPostIdsByUserIdAndPostIdIn(@Param("userId") Integer userId, @Param("postIds") Collection<Integer> postIds);
}

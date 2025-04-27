package com.example.CMPE352.repository;

import com.example.CMPE352.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikeId> {

    boolean existsByUserIdAndPostId(Integer userId, Integer postId);

    void deleteByUserIdAndPostId(Integer userId, Integer postId);

    List<PostLike> findByPostId(Integer postId);

    PostLike findByUserIdAndPostId(Integer userId, Integer postId);

}

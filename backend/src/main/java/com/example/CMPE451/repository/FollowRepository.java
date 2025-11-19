package com.example.CMPE451.repository;

import com.example.CMPE451.model.Follow;
import com.example.CMPE451.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Integer> {

    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    boolean existsByFollowerAndFollowing(User follower, User following);

    List<Follow> findAllByFollowing(User user);

    List<Follow> findAllByFollower(User user);

    Integer countByFollowing(User user);

    Integer countByFollower(User user);
}
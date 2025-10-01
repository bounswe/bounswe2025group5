package com.example.CMPE451.repository;


import com.example.CMPE451.model.User;
import com.example.CMPE451.model.UserReward;
import com.example.CMPE451.model.UserRewardId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRewardRepository extends JpaRepository<UserReward, UserRewardId> {

    List<UserReward> findByUser(User user);

    List<UserReward> findByUserAndIsTakenFalse(User user);

}
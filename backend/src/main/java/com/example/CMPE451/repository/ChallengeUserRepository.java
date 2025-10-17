package com.example.CMPE451.repository;

import com.example.CMPE451.model.ChallengeUser;
import com.example.CMPE451.model.ChallengeUserId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChallengeUserRepository extends JpaRepository<ChallengeUser, ChallengeUserId> {


    default Optional<ChallengeUser> findByChallengeIdAndUserId(Integer challengeId, Integer userId) {
        return findById(new ChallengeUserId(challengeId, userId));
    }

    List<ChallengeUser> findByIdUserId(Integer userId);

    List<ChallengeUser> findByIdChallengeIdOrderByAmountDesc(Integer challengeId);


}

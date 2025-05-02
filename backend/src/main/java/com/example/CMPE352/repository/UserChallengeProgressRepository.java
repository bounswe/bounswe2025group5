package com.example.CMPE352.repository;

import com.example.CMPE352.model.UserChallengeProgress;
import com.example.CMPE352.model.UserChallengeProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserChallengeProgressRepository extends JpaRepository<UserChallengeProgress, UserChallengeProgressId> {

    boolean existsByUserIdAndChallengeChallengeId(int userId, int challengeId);

}

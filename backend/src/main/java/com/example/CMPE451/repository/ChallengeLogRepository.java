package com.example.CMPE451.repository;

import com.example.CMPE451.model.Challenge;
import com.example.CMPE451.model.ChallengeLog;
import com.example.CMPE451.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ChallengeLogRepository extends JpaRepository<ChallengeLog, Integer> {

     List<ChallengeLog> findByUser(User user);
     List<ChallengeLog> findByChallenge(Challenge challenge);

    List<ChallengeLog> findByChallenge_ChallengeIdAndUser_Id(Integer challengeId, Integer userId);


}

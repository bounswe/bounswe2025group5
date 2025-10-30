package com.example.CMPE451.service;

import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.*;
import com.example.CMPE451.model.request.AttendChallengeRequest;
import com.example.CMPE451.model.request.CreateChallengeRequest;
import com.example.CMPE451.model.request.LogChallengeRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.repository.ChallengeLogRepository;
import com.example.CMPE451.repository.ChallengeRepository;
import com.example.CMPE451.repository.ChallengeUserRepository;
import com.example.CMPE451.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final UserRepository userRepository;
    private final ChallengeUserRepository challengeUserRepository;
    private final ChallengeLogRepository challengeLogRepository;


    @Transactional
    public ChallengeResponse createChallenge(CreateChallengeRequest request) {
        Challenge savedChallenge = challengeRepository.save(new Challenge(
                request.getName(),
                request.getDescription(),
                request.getType(),
                request.getAmount(),
                request.getStartDate(),
                request.getEndDate(),
                0.0
        ));

        return new ChallengeResponse(
                savedChallenge.getChallengeId(),
                savedChallenge.getName(),
                savedChallenge.getAmount(),
                savedChallenge.getDescription(),
                savedChallenge.getStartDate(),
                savedChallenge.getEndDate(),
                savedChallenge.getStatus(),
                savedChallenge.getType()
        );
    }

    @Transactional
    public EndChallengeResponse endChallenge(int id) {
        Optional<Challenge> optionalChallenge = challengeRepository.findById(id);
        if (optionalChallenge.isEmpty()) {
            throw new NotFoundException("Challenge with ID " + id + " not found.");
        }
        Challenge challenge = optionalChallenge.get();
        challenge.setStatus(Challenge.Status.Ended);
        challenge.setEndDate(LocalDate.now());
        challengeRepository.saveAndFlush(challenge);

        return new EndChallengeResponse(challenge.getChallengeId(), true);
    }

    @Transactional
    public AttendChallengeResponse attendChallenge(AttendChallengeRequest request,Integer id) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("User with the name " + request.getUsername() + " not found"));

        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Challenge with ID " +id + " not found"));

        ChallengeUser progress = new ChallengeUser(
                challenge,
                user
        );
        challengeUserRepository.save(progress);

        return new AttendChallengeResponse(user.getUsername(), challenge.getChallengeId());
    }


    @Transactional
    public LeaveChallengeResponse leaveChallenge(String username, int challengeId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User with the name " + username + " not found"));

        challengeRepository.findById(challengeId)
                .orElseThrow(() -> new NotFoundException("Challenge with ID " + challengeId + " not found"));

        ChallengeUserId id = new ChallengeUserId(challengeId, user.getId());

        if (!challengeUserRepository.existsById(id)) {
            throw new NotFoundException("User is not participating in this challenge.");
        }

        challengeUserRepository.deleteById(id);
        return new LeaveChallengeResponse(user.getUsername(), challengeId, true);
    }

    @Transactional(readOnly = true)
    public List<ChallengeInfoResponse> getAllChallenges(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User with the name " + username + " not found"));

        List<Challenge> allChallenges = challengeRepository.findAll();

        List<ChallengeUser> userParticipations = challengeUserRepository.findByIdUserId(user.getId());

        Set<Integer> participatedChallengeIds = userParticipations.stream()
                .map(participation -> participation.getChallenge().getChallengeId())
                .collect(Collectors.toSet());

        return allChallenges.stream()
                .map(challenge -> new ChallengeInfoResponse(
                        challenge.getChallengeId(),
                        challenge.getName(),
                        challenge.getAmount(),
                        challenge.getDescription(),
                        challenge.getStartDate(),
                        challenge.getEndDate(),
                        challenge.getStatus(),
                        challenge.getType(),
                        challenge.getCurrentAmount(),
                        participatedChallengeIds.contains(challenge.getChallengeId())
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntry> getLeaderboardForChallenge(Integer challengeId) {
        challengeRepository.findById(challengeId)
                .orElseThrow(() -> new NotFoundException("Challenge with ID " + challengeId + " not found"));
        List<ChallengeUser> leaderboardData = challengeUserRepository.findByIdChallengeIdOrderByAmountDesc(challengeId);

        return leaderboardData.stream()
                .map(challengeUser -> new LeaderboardEntry(
                        challengeUser.getUser().getUsername(),
                        challengeUser.getAmount()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public LogChallengeResponse logChallengeProgress(Integer challengeId, LogChallengeRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("User not found: " + request.getUsername()));

        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new NotFoundException("Challenge not found with ID: " + challengeId));

        ChallengeUser challengeUser = challengeUserRepository.findByChallengeIdAndUserId(challengeId, user.getId())
                .orElseThrow(() ->  new NotFoundException("User is not participating in this challenge."));
        ;

        ChallengeLog newLog = new ChallengeLog(challenge, user, request.getAmount());
        challengeLogRepository.save(newLog);

        double newTotalAmount = challengeUser.getAmount() + request.getAmount();
        challengeUser.setAmount(newTotalAmount);
        challengeUser= challengeUserRepository.saveAndFlush(challengeUser);


        return new LogChallengeResponse(user.getUsername(), challengeId, challengeUser.getAmount());
    }

    @Transactional(readOnly = true)
    public UserChallengeLogsResponse getUserLogsForChallenge(Integer challengeId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        if (!challengeRepository.existsById(challengeId)) {
            throw new NotFoundException("Challenge not found with ID: " + challengeId);
        }

        List<ChallengeLog> logs = challengeLogRepository.findByChallenge_ChallengeIdAndUser_Id(challengeId, user.getId());

        List<ChallengeLogInfo> logInfos = logs.stream()
                .map(log -> new ChallengeLogInfo(log.getAmount(), log.getTimestamp()))
                .collect(Collectors.toList());

        return new UserChallengeLogsResponse(username, challengeId, logInfos);
    }

    @Transactional(readOnly = true)
    public List<ChallengesResponse> getAllChallengesForHomePage() {
        return challengeRepository.findAll().stream()
                .map(challenge -> new ChallengesResponse(
                        challenge.getChallengeId(),
                        challenge.getName(),
                        challenge.getAmount(),
                        challenge.getDescription(),
                        challenge.getStartDate(),
                        challenge.getEndDate(),
                        challenge.getStatus(),
                        challenge.getType()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MyChallengeResponse> getAttendedChallenges(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User with the name " + username + " not found"));

        List<ChallengeUser> participations = challengeUserRepository.findByIdUserId(user.getId());

        return participations.stream()
                .map(participation -> new MyChallengeResponse(
                        participation.getChallenge(),
                        participation.getAmount()
                ))
                .collect(Collectors.toList());
    }
}

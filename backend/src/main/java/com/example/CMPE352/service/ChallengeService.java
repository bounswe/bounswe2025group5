package com.example.CMPE352.service;

import com.example.CMPE352.exception.NotFoundException;
import com.example.CMPE352.model.Challenge;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.UserChallengeProgress;
import com.example.CMPE352.model.UserChallengeProgressId;
import com.example.CMPE352.model.request.AttendChallengeRequest;
import com.example.CMPE352.model.request.CreateChallengeRequest;
import com.example.CMPE352.model.response.*;
import com.example.CMPE352.repository.ChallengeRepository;
import com.example.CMPE352.repository.UserChallengeProgressRepository;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final UserRepository userRepository;
    private final UserChallengeProgressRepository userChallengeProgressRepository;


    @Transactional
    public ChallengeResponse createChallenge(CreateChallengeRequest request) {
        Challenge savedChallenge = challengeRepository.save(new Challenge(
                request.getName(),
                request.getDescription(),
                request.getAmount(),
                request.getStartDate(),
                request.getEndDate(),
                request.getWasteType()
        ));

        return new ChallengeResponse(
                savedChallenge.getChallengeId(),
                savedChallenge.getName(),
                savedChallenge.getAmount(),
                savedChallenge.getDescription(),
                savedChallenge.getStartDate(),
                savedChallenge.getEndDate(),
                savedChallenge.getStatus(),
                savedChallenge.getWasteType()
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
    public AttendChallengeResponse attendChallenge(AttendChallengeRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("User with the name " + request.getUsername() + " not found"));

        Challenge challenge = challengeRepository.findById(request.getChallengeId())
                .orElseThrow(() -> new NotFoundException("Challenge with ID " + request.getChallengeId() + " not found"));

        Double remainingAmount = challenge.getAmount();

        UserChallengeProgress progress = new UserChallengeProgress(
                user,
                challenge,
                challenge.getWasteType(),
                remainingAmount
        );
        userChallengeProgressRepository.save(progress);

        return new AttendChallengeResponse(user.getUsername(), remainingAmount, challenge.getChallengeId());
    }

    @Transactional
    public LeaveChallengeResponse leaveChallenge(String username, int challengeId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User with the name " + username + " not found"));

        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new NotFoundException("Challenge with ID " + challengeId + " not found"));

        UserChallengeProgressId id = new UserChallengeProgressId(user.getId(), challenge.getChallengeId());

        if (!userChallengeProgressRepository.existsById(id)) {
            throw new NotFoundException("User is not participating in this challenge.");
        }

        userChallengeProgressRepository.deleteById(id);
        return new LeaveChallengeResponse(user.getUsername(), challenge.getChallengeId(), true);
    }


    public List<LeaderboardEntry> getLeaderboardForChallenge(Integer challengeId) {
        challengeRepository.findById(challengeId)
                .orElseThrow(() -> new NotFoundException("Challenge with ID " + challengeId + " not found"));

        List<UserChallengeProgress> progressList = userChallengeProgressRepository.findById_ChallengeIdOrderByRemainingAmountDesc(challengeId);

        return progressList.stream()
                .map(progress -> new LeaderboardEntry(
                        progress.getUser().getId(),
                        progress.getUser().getUsername(),
                        progress.getRemainingAmount()
                ))
                .collect(Collectors.toList());
    }

    public List<ChallengeListResponse> getAllChallenges(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));
        int userId = user.getId();

        return challengeRepository.findAll().stream()
                .map(ch -> {
                    boolean attends = userChallengeProgressRepository
                            .existsByUserIdAndChallengeChallengeId(userId, ch.getChallengeId());
                    return new ChallengeListResponse(
                            ch.getChallengeId(),
                            ch.getName(),
                            ch.getAmount(),
                            ch.getDescription(),
                            ch.getStartDate(),
                            ch.getEndDate(),
                            ch.getStatus(),
                            ch.getWasteType(),
                            attends
                    );
                })
                .collect(Collectors.toList());
    }
}

package com.example.CMPE451.service;

import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.Badge;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.BadgeResponse;
import com.example.CMPE451.model.response.ChallengeListResponse;
import com.example.CMPE451.model.response.UserCountResponse;
import com.example.CMPE451.repository.BadgeRepository;
import com.example.CMPE451.repository.ChallengeRepository;
import com.example.CMPE451.repository.UserChallengeProgressRepository;
import com.example.CMPE451.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ChallengeRepository  challengeRepository;
    private final UserChallengeProgressRepository userChallengeProgressRepository;
    private final BadgeRepository badgeRepository;

    public UserCountResponse getUserCount() {
        long count = userRepository.countAllUsers();
        return  new UserCountResponse(count);
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
    public List<BadgeResponse> getBadges(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        List<Badge> badges = badgeRepository.findByUserId(user.getId());

        return badges.stream()
                .map(badge -> new BadgeResponse(user.getUsername(), badge.getId().getName()))
                .toList();
    }
}
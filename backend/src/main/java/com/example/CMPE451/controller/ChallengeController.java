package com.example.CMPE451.controller;


import com.example.CMPE451.model.request.AttendChallengeRequest;
import com.example.CMPE451.model.request.CreateChallengeRequest;
import com.example.CMPE451.model.request.LogChallengeRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.model.response.ChallengeInfoResponse;
import com.example.CMPE451.service.ChallengeService;
import com.example.CMPE451.model.response.ChallengeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final  ChallengeService challengeService;


    @PostMapping("/{id}/log")
    public ResponseEntity<LogChallengeResponse> logChallengeProgress(
            @PathVariable Integer id,
            @RequestBody LogChallengeRequest request) {
        LogChallengeResponse response = challengeService.logChallengeProgress(id, request);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/{id}/logs/{username}")
    public ResponseEntity<UserChallengeLogsResponse> getUserLogsForChallenge(
            @PathVariable Integer id,
            @PathVariable String username) {
        UserChallengeLogsResponse response = challengeService.getUserLogsForChallenge(id, username);
        return ResponseEntity.ok(response);
    }


    @PostMapping
    public ResponseEntity<ChallengeResponse> createChallenge(@RequestBody CreateChallengeRequest challenge) {
        ChallengeResponse createdChallenge = challengeService.createChallenge(challenge);
        return ResponseEntity.ok(createdChallenge);
    }

    @GetMapping
            ("/{username}")
    public ResponseEntity<List<ChallengeInfoResponse>> getAllChallenge(@PathVariable String username) {
        List<ChallengeInfoResponse> challengeInfoResponse = challengeService.getAllChallenges(username);
        return ResponseEntity.ok(challengeInfoResponse);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<EndChallengeResponse> endChallenge(@PathVariable int id) {
        EndChallengeResponse ended = challengeService.endChallenge(id);
        return ResponseEntity.ok(ended);
    }


    @PostMapping("/{id}/attendees")
    public ResponseEntity<AttendChallengeResponse> attendChallenge(@RequestBody AttendChallengeRequest request,@PathVariable int id) {
        AttendChallengeResponse progress = challengeService.attendChallenge(request,id);
        return ResponseEntity.ok(progress);
    }

    @DeleteMapping("/{challengeId}/attendees/{username}")
    public ResponseEntity<LeaveChallengeResponse> leaveChallenge(@PathVariable String username, @PathVariable int challengeId) {
        LeaveChallengeResponse response = challengeService.leaveChallenge(username, challengeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getChallengeLeaderboard(   @PathVariable Integer id) {
        List<LeaderboardEntry> leaderboard = challengeService.getLeaderboardForChallenge(id);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/homepage")
    public ResponseEntity<List<ChallengesResponse>> getAllChallengesForHome() {
        return ResponseEntity.ok(challengeService.getAllChallengesForHomePage());
    }
    @GetMapping("/{username}/attended")
    public ResponseEntity<List<MyChallengeResponse>> getAttendedChallenges(
            @PathVariable String username) {
        List<MyChallengeResponse> challenges = challengeService.getAttendedChallenges(username);
        return ResponseEntity.ok(challenges);
    }

}

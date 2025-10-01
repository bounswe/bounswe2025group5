package com.example.CMPE451.controller;


import com.example.CMPE451.model.request.AttendChallengeRequest;
import com.example.CMPE451.model.request.CreateChallengeRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.service.ChallengeService;
import com.example.CMPE451.model.response.ChallengeListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final  ChallengeService challengeService;

    @PostMapping("/create")
    public ResponseEntity<ChallengeResponse> createChallenge(@RequestBody CreateChallengeRequest challenge) {
        ChallengeResponse createdChallenge = challengeService.createChallenge(challenge);
        return ResponseEntity.ok(createdChallenge);
    }

    @PutMapping("/end/{id}")
    public ResponseEntity<EndChallengeResponse> endChallenge(@PathVariable int id) {
        EndChallengeResponse ended = challengeService.endChallenge(id);

        return ResponseEntity.ok(ended);
    }


    @PostMapping("/attend")
    public ResponseEntity<AttendChallengeResponse> attendChallenge(@RequestBody AttendChallengeRequest request) {
        AttendChallengeResponse progress = challengeService.attendChallenge(request);
        return ResponseEntity.ok(progress);
    }

    @DeleteMapping("/leave/{username}/{challengeId}")
    public ResponseEntity<LeaveChallengeResponse> leaveChallenge(@PathVariable String username, @PathVariable int challengeId) {
        LeaveChallengeResponse response = challengeService.leaveChallenge(username, challengeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getChallengeLeaderboard(   @RequestParam("id") Integer challengeId) {
        List<LeaderboardEntry> leaderboard = challengeService.getLeaderboardForChallenge(challengeId);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping
    public ResponseEntity<List<ChallengeListResponse>> getAll(
            @RequestParam("username") String username) {
        List<ChallengeListResponse> list = challengeService.getAllChallenges(username);
        return ResponseEntity.ok(list);
    }
}

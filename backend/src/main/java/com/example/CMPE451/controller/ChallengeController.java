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

    @PostMapping
    public ResponseEntity<ChallengeResponse> createChallenge(@RequestBody CreateChallengeRequest challenge) {
        ChallengeResponse createdChallenge = challengeService.createChallenge(challenge);
        return ResponseEntity.ok(createdChallenge);
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


}

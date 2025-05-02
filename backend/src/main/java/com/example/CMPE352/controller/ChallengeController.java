package com.example.CMPE352.controller;


import com.example.CMPE352.model.request.AttendChallengeRequest;
import com.example.CMPE352.model.request.CreateChallengeRequest;
import com.example.CMPE352.model.response.AttendChallengeResponse;
import com.example.CMPE352.model.response.ChallengeResponse;
import com.example.CMPE352.model.response.EndChallengeResponse;
import com.example.CMPE352.model.response.LeaveChallengeResponse;
import com.example.CMPE352.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


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
}

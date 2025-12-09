package com.example.CMPE451.controller;

import com.example.CMPE451.model.Feedback;
import com.example.CMPE451.model.request.FeedbackRequest;
import com.example.CMPE451.model.response.FeedbackResponse;
import com.example.CMPE451.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @GetMapping("/unseen/{username}")
    public ResponseEntity<List<FeedbackResponse>> getUnSeenFeedbacks(@PathVariable  String username) {
        List<FeedbackResponse> unseenFeedbacks = feedbackService.getUnSeenFeedbacks( username);
        return ResponseEntity.ok(unseenFeedbacks);
    }

    @PostMapping
    public ResponseEntity<FeedbackResponse> writeFeedback(@RequestBody FeedbackRequest feedbackRequest) {
        FeedbackResponse savedFeedback = feedbackService.writeFeedback(feedbackRequest);
        return ResponseEntity.ok(savedFeedback);
    }


    @PutMapping("/seen/{feedbackId}/{username}")
    public ResponseEntity<?> markAsSeen(@PathVariable Integer feedbackId, @PathVariable String username) {
        feedbackService.markFeedbackAsSeen(feedbackId, username);
        return ResponseEntity.ok(java.util.Collections.singletonMap("success", true));
    }
}
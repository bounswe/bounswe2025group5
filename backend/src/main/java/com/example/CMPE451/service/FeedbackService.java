package com.example.CMPE451.service;

import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.Feedback;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.request.FeedbackRequest;
import com.example.CMPE451.model.response.FeedbackResponse;
import com.example.CMPE451.repository.FeedbackRepository;
import com.example.CMPE451.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private ActivityLogger activityLogger;

    @Autowired
    private UserRepository userRepository;

    public List<FeedbackResponse> getUnSeenFeedbacks(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        if (!user.getIsModerator()) {
            throw new InvalidCredentialsException("Access Denied: Only moderators can view unseen feedback.");
        }
        List<Feedback> feedbacks = feedbackRepository.findByIsSeen(0);
        return feedbacks.stream()
                .map(feedback -> new FeedbackResponse(
                        feedback.getId(),
                        feedback.getFeedbacker().getUsername(),
                        feedback.getContentType(),
                        feedback.getContent(),
                        feedback.getCreatedAt()
                ))
                .toList();
    }


    public FeedbackResponse writeFeedback(FeedbackRequest feedbackRequest) {
        User feedbacker = userRepository.findByUsername(feedbackRequest.getFeedbackerUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + feedbackRequest.getFeedbackerUsername()));

        Feedback feedback = new Feedback();
        feedback.setFeedbacker(feedbacker);
        feedback.setContentType(feedbackRequest.getContentType());
        feedback.setContent(feedbackRequest.getContent());
        feedback.setIsSeen(0);
        Feedback feedbackSaved  =feedbackRepository.saveAndFlush(feedback);
        return new FeedbackResponse(feedbackSaved.getId(),feedbackSaved.getFeedbacker().getUsername(),feedbackSaved.getContentType(),feedbackSaved.getContent(),feedbackSaved.getCreatedAt());
    }


    public void markFeedbackAsSeen(Integer feedbackId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        if (!user.getIsModerator()) {
            throw new InvalidCredentialsException("Access Denied: Only moderators can mark feedback as seen.");
        }
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new NotFoundException("Feedback not found with ID: " + feedbackId));

        feedback.setIsSeen(1);
        feedbackRepository.save(feedback);

        activityLogger.logAction(
                "Create",
                "Moderator", username,
                "Feedback", feedbackId,
                "User", feedback.getFeedbacker().getUsername(),
                getFirst255Characters(feedback.getContent())
        );
    }

    public static String getFirst255Characters(String text) {
        if (text == null) {
            return null;
        }

        int maxLength = 255;

        if (text.length() > maxLength) {
            return text.substring(0, maxLength);
        } else {
            return text;
        }
    }
}
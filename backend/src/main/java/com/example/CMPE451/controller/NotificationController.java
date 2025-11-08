package com.example.CMPE451.controller;

import com.example.CMPE451.model.Notification;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.NotificationResponse;
import com.example.CMPE451.repository.UserRepository;
import com.example.CMPE451.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping("/{username}")
    public List<NotificationResponse> getNotifications(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return notificationService.getUnreadNotifications(user);
    }

    @PostMapping("/read/{id}")
    public void markAsRead(@PathVariable Integer id) {
        notificationService.markAsRead(id);
    }
}

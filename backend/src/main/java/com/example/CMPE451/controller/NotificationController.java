package com.example.CMPE451.controller;

import com.example.CMPE451.model.Notification;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.NotificationResponse;
import com.example.CMPE451.repository.UserRepository;
import com.example.CMPE451.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
        return notificationService.getNotifications(user);
    }

    @PostMapping("/read/{id}")
    public ResponseEntity<Map<String, Boolean>> markAsRead(@PathVariable Integer id) {
        boolean success = notificationService.markAsRead(id);

        if (!success) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false));
        }

        return ResponseEntity.ok(Map.of("success", true));
    }

}

package com.example.CMPE451.service;

import com.example.CMPE451.model.User;
import com.example.CMPE451.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ActivityLogger {

    private static final Logger log = LoggerFactory.getLogger("com.example.activity");
    private static final ObjectMapper mapper = new ObjectMapper();
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public ActivityLogger(NotificationService notificationService, UserRepository userRepository) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public void logAction(String type,
                          String actorType, Object actorId,
                          String objectType, Object objectId,
                          String targetType, Object targetId) {
        try {
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("@context", "https://www.w3.org/ns/activitystreams");
            activity.put("type", type);

            Map<String, Object> actorMap = Map.of("type", actorType, "id", actorId);
            Map<String, Object> objectMap = Map.of("type", objectType, "id", objectId);
            Map<String, Object> targetMap = targetType != null || targetId != null
                    ? Map.of("type", targetType, "id", targetId)
                    : null;

            activity.put("actor", actorMap);
            activity.put("object", objectMap);
            activity.put("target", targetMap);
            activity.put("published", Instant.now().toString());

            String json = mapper.writeValueAsString(activity);
            log.info(json);

            // A post has been liked. Notify the owner of the post
            if ("Like".equals(type)) {
                User targetUser = userRepository.findByUsername((String) targetId)
                        .orElse(null);

                String message = actorId + " liked your post with id " + objectId;
                notificationService.createNotification(targetUser, message);
            }

            else if ("End".equals(type)) {

                // A challenge has ended. Notify all users who have attended it.
                if ("Challenge".equals(objectType)) {
                    List<String> targetUsernames = ((List<?>) targetId).stream()
                            .filter(u -> u instanceof String)
                            .map(u -> (String) u)
                            .toList();

                    List<User> targetUsers = userRepository.findAllByUsernameIn(targetUsernames);

                    targetUsers.forEach(user -> {
                        String message = "Challenge with id " + objectId + " has ended";
                        notificationService.createNotification(user, message);
                    });
                }
            }

            else if ("Comment".equals(type)) {
                User targetUser = userRepository.findByUsername((String) targetId)
                        .orElse(null);

                String message = "User with id " + actorId + " left the comment with id " + objectId;
                notificationService.createNotification(targetUser, message);
            }


        } catch (Exception e) {
            log.error("Failed to log activity: {}", e.getMessage());
        }
    }
}

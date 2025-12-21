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
import java.util.Collections;

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

    private String safe(Object o) {
        return o == null ? "" : o.toString();
    }

    @SuppressWarnings("unchecked")
    public void logAction(String type,
                          String actorType, Object actorId,
                          String objectType, Object objectId,
                          String targetType, Object targetId,
                          String preview, String profile_picture) {
        try {
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("@context", "https://www.w3.org/ns/activitystreams");
            activity.put("type", safe(type));

            Map<String, Object> actorMap = Map.of(
                    "type", safe(actorType),
                    "id", safe(actorId)
            );

            Map<String, Object> objectMap = Map.of(
                    "type", safe(objectType),
                    "id", safe(objectId)
            );

            Map<String, Object> targetMap = (targetType != null || targetId != null)
                    ? Map.of("type", safe(targetType), "id", safe(targetId))
                    : null;

            activity.put("actor", actorMap);
            activity.put("object", objectMap);
            activity.put("target", targetMap);
            activity.put("published", Instant.now().toString());

            String json = mapper.writeValueAsString(activity);
            log.info(json);

            List<String> targetUsernames;

            if (targetId instanceof List<?> l) {
                targetUsernames = l.stream()
                        .filter(u -> u != null && !u.toString().isBlank())
                        .map(Object::toString)
                        .toList();
            }
            else if (targetId != null && !targetId.toString().isBlank()) {
                targetUsernames = List.of(targetId.toString());
            }
            else {
                targetUsernames = Collections.emptyList();
            }


            List<User> targetUsers = userRepository.findAllByUsernameIn(targetUsernames);

            for (User user : targetUsers) {
                notificationService.createNotification(
                        user,
                        safe(type),
                        safe(objectType),
                        safe(actorId),
                        safe(objectId),
                        safe(preview),
                        safe(profile_picture)
                );
            }


        } catch (Exception e) {
            log.error("Failed to log activity: {}", e.getMessage());
        }
    }
}

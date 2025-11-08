package com.example.CMPE451.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class ActivityLogger {

    private static final Logger log = LoggerFactory.getLogger("com.example.activity");
    private static final ObjectMapper mapper = new ObjectMapper();


    public void logAction(String type,
                          String actorType, Object actorId,
                          String objectType, Object objectId,
                          String targetType, Object targetId) {
        try {
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("@context", "https://www.w3.org/ns/activitystreams");
            activity.put("type", type);

            Map<String, Object> actorMap = new LinkedHashMap<>();
            actorMap.put("type", actorType);
            actorMap.put("id", actorId);
            activity.put("actor", actorMap);

            Map<String, Object> objectMap = new LinkedHashMap<>();
            objectMap.put("type", objectType);
            objectMap.put("id", objectId);
            activity.put("object", objectMap);

            if (targetType != null || targetId != null) {
                Map<String, Object> targetMap = new LinkedHashMap<>();
                targetMap.put("type", targetType);
                targetMap.put("id", targetId);
                activity.put("target", targetMap);
            } else {
                activity.put("target", null);
            }

            activity.put("published", Instant.now().toString());

            String json = mapper.writeValueAsString(activity);
            log.info(json);
        } catch (Exception e) {
            log.error("Failed to log activity: {}", e.getMessage());
        }
    }
}

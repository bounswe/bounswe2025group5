package com.example.CMPE451.service;

import com.example.CMPE451.model.Notification;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.NotificationResponse;
import com.example.CMPE451.repository.NotificationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification createNotification(User user, String message, String objectType, String objectId, String actorUsername) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setIsRead(false);
        notification.setObjectType(objectType);
        notification.setObjectId(objectId);
        notification.setActorUsername(actorUsername);
        return notificationRepository.save(notification);
    }


    public List<NotificationResponse> getNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(n -> {
                    NotificationResponse dto = new NotificationResponse();
                    dto.setId(n.getId());
                    dto.setMessage(n.getMessage());
                    dto.setIsRead(n.getIsRead());
                    dto.setCreatedAt(n.getCreatedAt());
                    dto.setObjectId(n.getObjectId());
                    dto.setObjectType(n.getObjectType());
                    dto.setActorUsername(n.getActorUsername());
                    return dto;
                })
                .toList();
    }


    @Transactional
    public boolean markAsRead(Integer notificationId) {
        return notificationRepository.findById(notificationId).map(notification -> {
            notification.setIsRead(true);
            return true;
        }).orElse(false);
    }

}

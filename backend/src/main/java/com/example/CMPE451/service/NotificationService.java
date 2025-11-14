package com.example.CMPE451.service;

import com.example.CMPE451.model.Notification;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.NotificationResponse;
import com.example.CMPE451.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification createNotification(User user, String message, String objectType, String objectId) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setIsRead(false);
        notification.setObjectType(objectType);
        notification.setObjectId(objectId);
        return notificationRepository.save(notification);
    }


    public List<NotificationResponse> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user)
                .stream()
                .map(n -> {
                    NotificationResponse dto = new NotificationResponse();
                    dto.setId(n.getId());
                    dto.setMessage(n.getMessage());
                    dto.setIsRead(n.getIsRead());
                    dto.setCreatedAt(n.getCreatedAt());
                    dto.setObjectId(n.getObjectId());
                    dto.setObjectType(n.getObjectType());
                    return dto;
                })
                .toList();
    }


    public void markAsRead(Integer notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setIsRead(true);
            notificationRepository.delete(notification);
        });
    }
}

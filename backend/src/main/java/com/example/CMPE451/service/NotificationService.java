package com.example.CMPE451.service;

import com.example.CMPE451.model.Notification;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.NotificationResponse;
import com.example.CMPE451.repository.NotificationRepository;
import com.example.CMPE451.repository.ProfileRepository;
import com.example.CMPE451.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ProfileRepository profileRepository;

    public Notification createNotification(User user, String type, String objectType, String actorId ,String objectId, String preview, String profile_picture) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setActorId(actorId);
        notification.setType(type);
        notification.setIsRead(false);
        notification.setObjectType(objectType);
        notification.setObjectId(objectId);
        notification.setPreview(preview);
        notification.setProfile_picture(profile_picture);
        return notificationRepository.save(notification);
    }


    public List<NotificationResponse> getNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(n -> {
                    NotificationResponse dto = new NotificationResponse();
                    dto.setId(n.getId());
                    dto.setType(n.getType());
                    dto.setActorId(n.getActorId());
                    dto.setIsRead(n.getIsRead());
                    dto.setCreatedAt(n.getCreatedAt());
                    dto.setObjectId(n.getObjectId());
                    dto.setObjectType(n.getObjectType());
                    dto.setPreview(n.getPreview());
                    dto.setProfile_picture(n.getProfile_picture());
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

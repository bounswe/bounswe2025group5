package com.example.CMPE352.repository;


import com.example.CMPE352.model.Notification;
import com.example.CMPE352.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByUser(User user);

    List<Notification> findByUserAndIsRead(User user, boolean isRead);
}
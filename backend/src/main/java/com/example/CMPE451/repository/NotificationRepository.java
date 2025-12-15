package com.example.CMPE451.repository;


import com.example.CMPE451.model.Notification;
import com.example.CMPE451.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByUser(User user);

    List<Notification> findByActorId(String actorId);


    List<Notification> findByUserOrderByCreatedAtDesc(User user);
}
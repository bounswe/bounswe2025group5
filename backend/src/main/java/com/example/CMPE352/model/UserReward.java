package com.example.CMPE352.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "UserRewards")
@Data
public class UserReward {

    @EmbeddedId
    private UserRewardId id;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @MapsId("rewardId")
    @JoinColumn(name = "reward_id", nullable = false)
    private Reward reward;

    @Column(name = "is_taken", nullable = false)
    private Boolean isTaken = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;
}


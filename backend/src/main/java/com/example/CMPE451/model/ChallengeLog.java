package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "challenge_log")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChallengeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "amount", nullable = false)
    private Double amount;

    /**
     * The timestamp when this log entry was created.
     * It is not updatable and will be set automatically on creation.
     */
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public ChallengeLog(Challenge challenge, User user, Double amount) {
        this.challenge = challenge;
        this.user = user;
        this.amount = amount;
    }

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
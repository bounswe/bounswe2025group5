package com.example.CMPE451.model;

import com.example.CMPE451.exception.InvalidCredentialsException;
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

    @Column(name = "quantity", nullable = false)
    private Double quantity;
    @ManyToOne

    @JoinColumn(name = "item_id", nullable = false)
    private WasteItem item;


    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public ChallengeLog(Challenge challenge, User user, Double quantity,WasteItem item) {
        if (!item.getType().getId().equals(challenge.getType().getId())) {
            throw new InvalidCredentialsException(
                    "Validation failed: The logged item's type ('" + item.getType().getName() +
                            "') does not match the challenge's type ('" + challenge.getType().getName() + "')."
            );
        }
        this.challenge = challenge;
        this.user = user;
        this.quantity = quantity;
        this.item = item;
    }

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
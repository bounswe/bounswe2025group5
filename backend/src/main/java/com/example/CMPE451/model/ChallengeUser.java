package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "challenge_user")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChallengeUser {

    @EmbeddedId
    private ChallengeUserId id;

    @Column(name = "amount", nullable = false)
    private Double amount;


    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("challengeId")
    @JoinColumn(name = "challenge_id")
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    public ChallengeUser(Challenge challenge, User user) {
        this.challenge = challenge;
        this.user = user;
        this.id = new ChallengeUserId(challenge.getChallengeId(), user.getId());
        this.amount = 0.0;
    }
}

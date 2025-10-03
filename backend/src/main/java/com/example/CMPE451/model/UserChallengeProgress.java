package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "user_challenge_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserChallengeProgress implements Serializable {

    @EmbeddedId
    private UserChallengeProgressId id;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @MapsId("challengeId")
    @JoinColumn(name = "challenge_id")
    private Challenge challenge;

    @Enumerated(EnumType.STRING)
    @Column(name = "waste_type")
    private WasteGoal.wasteType wasteType;

    @Column(name = "remaining_amount")
    private Double remainingAmount;


    public UserChallengeProgress(User user, Challenge challenge, WasteGoal.wasteType wasteType, Double remainingAmount) {
        this.id = new UserChallengeProgressId(user.getId(), challenge.getChallengeId());
        this.user = user;
        this.challenge = challenge;
        this.wasteType = wasteType;
        this.remainingAmount = remainingAmount;
    }

}

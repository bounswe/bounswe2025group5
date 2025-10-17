package com.example.CMPE451.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

/**
 * This class represents the composite primary key for the ChallengeUser entity.
 * It must implement Serializable and override equals() and hashCode().
 */
@Embeddable
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChallengeUserId implements Serializable {

    @Column(name = "challenge_id")
    private Integer challengeId;

    @Column(name = "user_id")
    private Integer userId;

    // You need to implement equals and hashCode for composite keys.
    // Lombok's @Data annotation handles this for you automatically.
}
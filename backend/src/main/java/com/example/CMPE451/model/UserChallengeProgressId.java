package com.example.CMPE451.model;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserChallengeProgressId implements Serializable {
    private int userId;
    private int challengeId;
}
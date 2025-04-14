package com.example.CMPE352.model;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.*;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserChallengeId implements Serializable {
    private Integer userId;
    private Integer challengeId;
}
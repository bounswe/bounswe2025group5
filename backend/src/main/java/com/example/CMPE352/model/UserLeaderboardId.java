package com.example.CMPE352.model;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.*;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLeaderboardId implements Serializable {
    private Integer leaderboardId;
    private Integer userId;
}

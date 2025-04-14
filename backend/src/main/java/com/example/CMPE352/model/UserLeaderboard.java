package com.example.CMPE352.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "UserLeaderboard")
@Data
public class UserLeaderboard {

    @EmbeddedId
    private UserLeaderboardId id;

    @ManyToOne
    @MapsId("leaderboardId")
    @JoinColumn(name = "leaderboard_id", nullable = false)
    private Leaderboard leaderboard;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "ranking", nullable = false)
    private Integer ranking;

    @Column(name = "score", nullable = false)
    private Integer score;
}

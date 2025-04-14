package com.example.CMPE352.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "Leaderboards")
@Data
public class Leaderboard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "leaderboard_id")
    private Integer id;

    @Column(name = "location", length = 50)
    private String location;

    public enum Type { PAPER, PLASTIC, METAL, ORGANIC, GLASS}

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    public Challenge.ChallengeStatus status;

    @OneToMany(mappedBy = "leaderboard", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserLeaderboard> userLeaderboards;
}
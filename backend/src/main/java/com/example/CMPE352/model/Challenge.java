package com.example.CMPE352.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "Challenges")
@Data
public class Challenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "challenge_id", unique = true, nullable = false)
    private Integer id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    public String name;

    @Column(name = "description", nullable = false, unique = true, length = 200)
    public String description;

    @Column(name = "start_date", nullable = false)
    public LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    public LocalDateTime endDate;

    public enum ChallengeStatus { ACTIVE, REQUESTED, ENDED }

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    public ChallengeStatus status;

    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserChallenge> userChallenges;
    }
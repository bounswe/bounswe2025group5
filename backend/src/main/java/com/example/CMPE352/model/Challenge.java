package com.example.CMPE352.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "challenges")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "challenge_id")
    private int challengeId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "amount", nullable = false, length = 100)
    private Double amount;

    @Column(name = "description", nullable = false, length = 200)
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Enumerated(EnumType.STRING)
    @Column(name = "waste_type", nullable = false)
    private WasteGoal.wasteType wasteType;

    public enum Status {
        Active,
        Requested,
        Ended
    }
    public Challenge(String name, String description, Double amount ,LocalDate startDate, LocalDate endDate, WasteGoal.wasteType wasteType) {
        this.name = name;
        this.description = description;
        this.amount=amount;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = Status.Active;
        this.wasteType = wasteType;
    }
}
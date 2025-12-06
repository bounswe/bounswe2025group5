package com.example.CMPE451.model;

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

    @Column(name = "description", nullable = false, length = 200)
    private String description;

    @ManyToOne
    @JoinColumn(name = "type", nullable = false)
    private WasteType type;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "current_amount", nullable = false)
    private Double currentAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    // The enum now matches the database schema
    public enum Status {
        Active,
        Requested,
        Ended,
        Completed
    }

    public Challenge(String name, String description, WasteType type, Double amount, LocalDate startDate, LocalDate endDate,Double currentAmount) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.amount = amount;
        this.currentAmount= currentAmount;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = Status.Active;
    }
}
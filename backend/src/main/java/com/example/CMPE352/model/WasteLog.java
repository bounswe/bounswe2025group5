package com.example.CMPE352.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "WasteLog")
public class WasteLog {

    public enum WasteType {
        Plastic, Organic, Paper, Metal, Glass
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(nullable = false)
    private Double amount; // This "amount" attribute has been added

    @Enumerated(EnumType.STRING)
    @Column(name = "wasteType", nullable = false)
    private WasteType wasteType;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @ManyToOne
    @JoinColumn(name = "goal_id", nullable = false)
    private WasteGoal goal;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onCreate() {
        this.date = LocalDateTime.now();
    }
}

package com.example.CMPE352.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;


@Entity
@Table(name = "WasteGoal")
@Data
public class WasteGoal {

    public enum wasteType {
        Plastic, Organic, Paper, Metal, Glass
    }

    public enum wasteUnit{
        Bottles, Grams, Kilograms, Liters, Units
    }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer goalId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false)
    private wasteUnit unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "wasteType", nullable = false)
    private wasteType wasteType;

    @ManyToOne
    @JoinColumn(name = "reward_id", nullable = false)
    private Reward reward;

    @Column(name = "duration", nullable = false)
    private int duration;

    @Column(name = "amount", nullable = false)
    private double amount;

    @Column(name = "completed", nullable = false)
    private boolean completed;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL)
    private List<WasteLog> logs;

    @PrePersist
    protected void onCreate() {
        this.date = LocalDate.now();
    }


}

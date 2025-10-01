package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;


@Entity
@Table(name = "WasteGoal")
@Data
@ToString(exclude = {"owner", "logs"})
@NoArgsConstructor
public class WasteGoal {

    public enum wasteType {
        Plastic, Organic, Paper, Metal, Glass
    }

    public enum wasteUnit{
        Bottles, Grams, Kilograms, Liters, Units
    }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "goal_id", nullable = false)
    private Integer goalId;

    @CreationTimestamp
    @Column(name = "date", updatable = false)
    private Timestamp date;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false)
    private wasteUnit unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "wasteType", nullable = false)
    private wasteType wasteType;

    @Column(name = "duration", nullable = false)
    private int duration;

    @Column(name = "amount", nullable = false)
    private double amount;

    @Column(name = "completed")
    private Integer completed;

    @Column(name = "percent_of_progress", nullable = false)
    private Double percentOfProgress;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL)
    private List<WasteLog> logs;


    public WasteGoal(User owner, int duration, wasteUnit unit, wasteType wasteType, double amount) {
        this.owner = owner;
        this.duration = duration;
        this.unit = unit;
        this.wasteType = wasteType;
        this.amount = amount;
        this.completed = 0; ;
        this.percentOfProgress=0.0;
        this.date= new Timestamp(System.currentTimeMillis());
    }
}

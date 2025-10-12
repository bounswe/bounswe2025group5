package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "WasteGoal")
@Data
@ToString(exclude = {"owner", "logs"})
@NoArgsConstructor
public class WasteGoal {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer goalId;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;


    @ManyToOne
    @JoinColumn(name = "type_id", nullable = false)
    private WasteType type;

    @Column(name = "duration", nullable = false)
    private int duration;

    @Column(name = "restriction_amount_grams", nullable = false)
    private double restrictionAmountGrams;

    @Column(name = "completed")
    private Integer completed;

    @Column(name = "percent_of_progress", nullable = false)
    private Double percentOfProgress;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL)
    private List<WasteLog> logs;

    public WasteGoal(User owner, int duration, WasteType wasteType, double restrictionAmountGrams) {
        this.owner = owner;
        this.duration = duration;
        this.type = wasteType;
        this.restrictionAmountGrams = restrictionAmountGrams;
        this.completed = 0;
        this.percentOfProgress = 0.0;
        this.date =  LocalDateTime.now();;
    }

}
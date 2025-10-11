

package com.example.CMPE451.model;

import com.example.CMPE451.exception.InvalidCredentialsException;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "WasteLog")
@NoArgsConstructor
public class WasteLog {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private WasteItem item;

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

    public WasteLog(User user, WasteGoal goal, WasteItem item, int quantity) {

        if (!item.getType().getId().equals(goal.getType().getId())) {
            throw new InvalidCredentialsException(
                    "Validation failed: The logged item's type ('" + item.getType().getName() +
                            "') does not match the goal's type ('" + goal.getType().getName() + "')."
            );
        }
        this.user = user;
        this.goal = goal;
        this.item = item;
        this.quantity = quantity;
    }

}


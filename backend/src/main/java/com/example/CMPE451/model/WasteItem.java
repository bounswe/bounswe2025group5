package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "WasteItem")
@Data
@NoArgsConstructor
public class WasteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Integer id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "weight_in_grams", nullable = false)
    private double weightInGrams;

    @ManyToOne
    @JoinColumn(name = "type_id", nullable = false)
    private WasteType type;
}
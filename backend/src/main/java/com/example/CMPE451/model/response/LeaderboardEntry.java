package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntry {
    private Integer userId;
    private String username;
    private Double remainingAmount;
}
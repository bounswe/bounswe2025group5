package com.example.CMPE451.model.response;

import com.example.CMPE451.model.Challenge;
import com.example.CMPE451.model.WasteGoal;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class BadgeResponse {
    private String username;
    private String badgeName;
}

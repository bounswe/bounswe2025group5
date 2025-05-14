package com.example.CMPE352.model.response;

import com.example.CMPE352.model.Challenge;
import com.example.CMPE352.model.WasteGoal;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class BadgeResponse {
    private String username;
    private String badgeName;
}

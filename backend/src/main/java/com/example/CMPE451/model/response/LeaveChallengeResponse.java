package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class LeaveChallengeResponse {
    private String username;
    private int challengeId;
    private boolean leaved;

}

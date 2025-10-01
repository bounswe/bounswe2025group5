package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class EndChallengeResponse {
    private int challengeId;
    private boolean ended;

}

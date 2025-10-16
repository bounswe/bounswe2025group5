package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserChallengeLogsResponse {
    private String username;
    private Integer challengeId;
    private List<ChallengeLogInfo> logs;
}

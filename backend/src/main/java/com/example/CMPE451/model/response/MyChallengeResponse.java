package com.example.CMPE451.model.response;

import com.example.CMPE451.model.Challenge;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyChallengeResponse {
    private Integer challengeId;
    private String name;
    private String description;
    private String type;
    private Challenge.Status status;
    private Double challengeGoalAmount;
    private Double challengeCurrentTotalAmount;
    private Double userContribution;

    public MyChallengeResponse(Challenge challenge, Double userContribution) {
        this.challengeId = challenge.getChallengeId();
        this.name = challenge.getName();
        this.description = challenge.getDescription();
        this.type = challenge.getType();
        this.status = challenge.getStatus();
        this.challengeGoalAmount = challenge.getAmount();
        this.challengeCurrentTotalAmount = challenge.getCurrentAmount();
        this.userContribution = userContribution;
    }
}
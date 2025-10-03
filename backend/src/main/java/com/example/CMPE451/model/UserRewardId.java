package com.example.CMPE451.model;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class UserRewardId implements Serializable {

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "reward_id")
    private Integer rewardId;
}
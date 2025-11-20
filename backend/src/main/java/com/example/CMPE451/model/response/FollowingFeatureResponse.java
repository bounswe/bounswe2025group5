package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FollowingFeatureResponse {
    private String follower;
    private String following;
    private Integer followerCount;
}

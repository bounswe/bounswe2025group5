package com.example.CMPE451.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowId implements Serializable {

    @Column(name = "follower_username", nullable = false, length = 50)
    private String followerUsername;

    @Column(name = "following_username", nullable = false, length = 50)
    private String followingUsername;
}
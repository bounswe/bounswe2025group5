package com.example.CMPE451.model.response;

import com.example.CMPE451.model.User;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class GetFollowingsResponse {
    private String username;
    private String photoUrl;

    public GetFollowingsResponse(User user) {
        this.username = user.getUsername();
        if (user.getProfile() != null) {
            this.photoUrl = user.getProfile().getPhotoUrl();
        }
    }
}
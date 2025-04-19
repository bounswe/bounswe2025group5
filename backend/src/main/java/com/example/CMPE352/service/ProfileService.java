package com.example.CMPE352.service;

import com.example.CMPE352.exception.AccessDeniedException;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.Profile;
import com.example.CMPE352.model.request.ProfileEditRequest;
import com.example.CMPE352.model.response.ProfileResponse;
import com.example.CMPE352.repository.ProfileRepository;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public ProfileResponse getProfileInfo(String username) {
        User user = userRepository
                        .findByUsername(username)
                        .orElseThrow();
        Profile p = profileRepository
                    .findByUser(user)
                    .orElseThrow();
        return new ProfileResponse(
                        p.getUser().getUsername(),
                        p.getBiography(),
                        p.getPhotoUrl());
    }

    public ProfileResponse editProfileInfo(
            String username,
            ProfileEditRequest newProfileInfo) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow();
        Profile p = profileRepository
                .findByUser(user)
                .orElseThrow();
        p.setBiography(newProfileInfo.getBiography());
        newProfileInfo.setPhotoUrl(newProfileInfo.getPhotoUrl());
        profileRepository.saveAndFlush(p);
        return new ProfileResponse(
                p.getUser().getUsername(),
                p.getBiography(),
                p.getPhotoUrl()
        );
    }
}

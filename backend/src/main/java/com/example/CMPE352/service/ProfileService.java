package com.example.CMPE352.service;

import com.example.CMPE352.exception.ProfileAlreadyExistsException;
import com.example.CMPE352.exception.NotFoundException;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.Profile;
import com.example.CMPE352.model.request.ProfileEditAndCreateRequest;
import com.example.CMPE352.model.response.ProfileResponse;
import com.example.CMPE352.repository.ProfileRepository;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;


@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public ProfileResponse getProfileInfo(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));
        Profile p = profileRepository
                .findByUser(user)
                .orElseThrow(() -> new NotFoundException("Profile not found for user: " + username));
        return new ProfileResponse(
                username,
                p.getBiography(),
                p.getPhotoUrl());
    }

    public ProfileResponse editProfileInfo(
            ProfileEditAndCreateRequest newProfileInfo) {
        User user = userRepository
                .findByUsername(newProfileInfo.getUsername())
                .orElseThrow(() -> new NotFoundException("User not found: " + newProfileInfo.getUsername()));
        Profile p = profileRepository
                .findByUser(user)
                .orElseThrow(() -> new NotFoundException("Profile not found for user: " + newProfileInfo.getUsername()));
        p.setBiography(newProfileInfo.getBiography());
        newProfileInfo.setPhotoUrl(newProfileInfo.getPhotoUrl());
        profileRepository.save(p);
        return new ProfileResponse(
                newProfileInfo.getUsername(),
                newProfileInfo.getBiography(),
                newProfileInfo.getPhotoUrl()
        );
    }

    public ProfileResponse createProfileInfo(
            ProfileEditAndCreateRequest newProfileInfo) {
        User user = userRepository
                .findByUsername(newProfileInfo.getUsername())
                .orElseThrow(() -> new NotFoundException("User not found: " + newProfileInfo.getUsername()));
        ;
        Optional<Profile> existingProfile = profileRepository.findByUser(user);
        if (existingProfile.isPresent()) {
            throw new ProfileAlreadyExistsException("Profile already exists for user: " + user.getUsername());
        }
        Profile profile = new Profile(user, newProfileInfo.getBiography(), newProfileInfo.getPhotoUrl());

        profileRepository.save(profile);

        return new ProfileResponse(
                newProfileInfo.getUsername(),
                newProfileInfo.getBiography(),
                newProfileInfo.getPhotoUrl()
        );

    }
}

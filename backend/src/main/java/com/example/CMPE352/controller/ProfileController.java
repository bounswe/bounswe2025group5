package com.example.CMPE352.controller;

import com.example.CMPE352.model.request.ProfileEditAndCreateRequest;
import com.example.CMPE352.service.ProfileService;
import com.example.CMPE352.model.response.ProfileResponse;
import org.springframework.web.bind.annotation.*;// profile/controller/ProfileController.java
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService service;

    @GetMapping("/profile/info")
    public ProfileResponse getProfileInfo(@RequestParam String username) {
        return service.getProfileInfo(username);
    }

    @PutMapping("/profile/edit")
    public ProfileResponse editProfile(
            @RequestBody ProfileEditAndCreateRequest newProfileInfo) {
        return service.editProfileInfo(newProfileInfo);
    }
    @PostMapping("/profile/create")
    public ProfileResponse createProfile(
            @RequestBody ProfileEditAndCreateRequest newProfileInfo) {
        return service.createProfileInfo(newProfileInfo);
    }

}

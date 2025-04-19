package com.example.CMPE352.controller;

import com.example.CMPE352.model.request.ProfileEditRequest;
import com.example.CMPE352.service.ProfileService;
import com.example.CMPE352.model.response.ProfileResponse;
import org.springframework.web.bind.annotation.*;// profile/controller/ProfileController.java
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService service;

    @GetMapping("/{username}/profile")
    public ProfileResponse getProfileInfo(@PathVariable String username) {
        return service.getProfileInfo(username);
    }

    @PutMapping("/{username}/profile/edit")
    public ProfileResponse editProfileInfo(
            @PathVariable String username,
            @RequestBody ProfileEditRequest newProfileInfo) {
        return service.editProfileInfo(username, newProfileInfo);
    }

}

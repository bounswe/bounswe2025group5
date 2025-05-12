package com.example.CMPE352.controller;

import com.example.CMPE352.model.request.ProfileEditAndCreateRequest;
import com.example.CMPE352.service.ProfileService;
import com.example.CMPE352.model.response.ProfileResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;// profile/controller/ProfileController.java
import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;


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

    @PostMapping(value = "/profile/{username}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileResponse> uploadProfilePhoto(
            @PathVariable String username,
            @RequestParam("file") MultipartFile file) {
        ProfileResponse response = service.uploadProfilePhoto(username,file);
        return ResponseEntity.ok(response);
    }



}

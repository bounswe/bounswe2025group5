package com.example.CMPE451.service;

import com.example.CMPE451.exception.AlreadyExistsException;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.exception.UploadFailedException;
import com.example.CMPE451.model.Badge;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.Profile;
import com.example.CMPE451.model.request.ProfileEditAndCreateRequest;
import com.example.CMPE451.model.response.BadgeResponse;
import com.example.CMPE451.model.response.ProfileResponse;
import com.example.CMPE451.repository.BadgeRepository;
import com.example.CMPE451.repository.ProfileRepository;
import com.example.CMPE451.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.Optional;


@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final S3Client s3Client;
    private final BadgeRepository badgeRepository;

    @Value("${digitalocean.spaces.bucket-name}")
    private String bucketName;

    @Value("${digitalocean.spaces.region}")
    private String region;

    @Value("${digitalocean.spaces.photo-folder}")
    private String photoFolder;

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


    @Transactional
    public ProfileResponse editProfileInfo(
            ProfileEditAndCreateRequest newProfileInfo,String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));
        Profile p = profileRepository
                .findByUser(user)
                .orElseThrow(() -> new NotFoundException("Profile not found for user: " + username));
        p.setBiography(newProfileInfo.getBiography());
        profileRepository.save(p);
        return new ProfileResponse(
                username,
                newProfileInfo.getBiography(),
                p.getPhotoUrl()
        );
    }


    @Transactional
    public ProfileResponse uploadProfilePhoto(String username, MultipartFile file) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        Profile profile = profileRepository.findByUser(user)
                .orElseGet(() -> {
                    Profile newProfile = new Profile(user, null, "");
                    return profileRepository.save(newProfile);
                });

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file. Please select a file.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String uniqueFileName = UUID.randomUUID().toString() + extension;
        String objectKey = this.photoFolder + "/" + uniqueFileName;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(this.bucketName)
                    .key(objectKey)
                    .contentType(file.getContentType())
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String publicUrl = String.format("https://%s.%s.digitaloceanspaces.com/%s",
                    this.bucketName,
                    this.region,
                    objectKey);
            profile.setPhotoUrl(publicUrl);
            profileRepository.save(profile);

            return new ProfileResponse(
                    user.getUsername(),
                    profile.getBiography(),
                    profile.getPhotoUrl()
            );
        } catch (IOException e) {
            throw new UploadFailedException("Failed to read file data for upload: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new UploadFailedException("Failed to upload profile photo to DigitalOcean Spaces. Reason: " + e.getMessage(), e);
        }
    }
}



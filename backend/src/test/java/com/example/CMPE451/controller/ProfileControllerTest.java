package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.ProfileEditAndCreateRequest;
import com.example.CMPE451.model.response.ProfileResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.ProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class ProfileControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ProfileService profileService;

    @MockBean
    private MyUserDetailsService myUserDetailsService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private JacksonTester<ProfileResponse> jsonProfileResponse;

    @Autowired
    private ObjectMapper objectMapper;


    @Test
    @WithMockUser
    void testGetProfileInfo() throws Exception {
        String username = "john_doe";
        ProfileResponse response = new ProfileResponse(
                username,
                "Hello world",
                "http://image.com/1.jpg",
                100,
                50
        );

        given(profileService.getProfileInfo(username)).willReturn(response);

        mvc.perform(get("/api/users/{username}/profile", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonProfileResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testEditProfile() throws Exception {
        String username = "jane_doe";

        ProfileEditAndCreateRequest request = new ProfileEditAndCreateRequest();
        request.setBiography("Updated Bio");

        ProfileResponse response = new ProfileResponse(
                username,
                "Updated Bio",
                "http://image.com/default.jpg",
                0,
                0
        );

        given(profileService.editProfileInfo(any(ProfileEditAndCreateRequest.class), eq(username)))
                .willReturn(response);

        mvc.perform(put("/api/users/{username}/profile", username)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonProfileResponse.write(response).getJson()));
    }


    @Test
    @WithMockUser
    void testUploadProfilePhoto() throws Exception {
        String username = "photo_user";

        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "avatar.png",
                MediaType.IMAGE_PNG_VALUE,
                "some-image-data".getBytes()
        );

        ProfileResponse response = new ProfileResponse(
                username,
                "Bio",
                "http://aws.s3.bucket/avatar.png",
                10,
                10
        );

        given(profileService.uploadProfilePhoto(eq(username), any(MultipartFile.class)))
                .willReturn(response);

        mvc.perform(multipart("/api/users/{username}/profile/picture", username)
                        .file(mockFile))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonProfileResponse.write(response).getJson()));
    }
}
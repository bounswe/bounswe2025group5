package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.ProfileEditAndCreateRequest;
import com.example.CMPE451.model.response.ProfileResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.ProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.json.JacksonTester;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class ProfileControllerTest {

    @TestConfiguration
    static class ProfileControllerConfig {
        @Bean
        public ProfileService profileService() {
            return Mockito.mock(ProfileService.class);
        }

        @Bean
        public MyUserDetailsService myUserDetailsService() {
            return Mockito.mock(MyUserDetailsService.class);
        }

        @Bean
        public JwtAuthFilter jwtAuthFilter() {
            return Mockito.mock(JwtAuthFilter.class);
        }
    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ProfileService profileService;

    private JacksonTester<ProfileResponse> jsonProfile;

    @BeforeEach
    void setup() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        JacksonTester.initFields(this, mapper);

        Mockito.reset(profileService);
    }

    @Test
    @WithMockUser
    void testGetProfileInfo() throws Exception {
        String username = "john";
        ProfileResponse response = new ProfileResponse(
                username, "bio", "photo.jpg", 5, 10
        );

        given(profileService.getProfileInfo(username)).willReturn(response);

        mvc.perform(get("/api/users/{username}/profile", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonProfile.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testEditProfile() throws Exception {
        String username = "john";

        ProfileEditAndCreateRequest request = new ProfileEditAndCreateRequest();
        request.setBiography("new bio");

        ProfileResponse response = new ProfileResponse(
                username, "new bio", "photo.jpg", 5, 10
        );

        given(profileService.editProfileInfo(request, username)).willReturn(response);

        mvc.perform(put("/api/users/{username}/profile", username)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(request))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonProfile.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testUploadProfilePhoto() throws Exception {
        String username = "john";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "profile.png",
                MediaType.IMAGE_PNG_VALUE,
                "dummy data".getBytes()
        );

        ProfileResponse response = new ProfileResponse(
                username, "bio", "http://photo-url", 5, 10
        );

        given(profileService.uploadProfilePhoto(username, file)).willReturn(response);

        mvc.perform(multipart("/api/users/{username}/profile/picture", username)
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonProfile.write(response).getJson()));
    }
}

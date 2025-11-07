package com.example.CMPE451.controller;

import com.example.CMPE451.model.response.FollowStatsResponse;
import com.example.CMPE451.model.response.FollowingFeatureResponse;
import com.example.CMPE451.model.response.GetFollowersResponse;
import com.example.CMPE451.model.response.GetFollowingsResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.FollowService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@WebMvcTest(FollowController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class FollowControllerTest {


    @TestConfiguration
    static class FollowControllerTestConfiguration {

        @Bean
        public FollowService followService() {
            return Mockito.mock(FollowService.class);
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
    private FollowService followService;

    private JacksonTester<FollowStatsResponse> jsonStatsResponse;
    private JacksonTester<FollowingFeatureResponse> jsonFollowResponse;
    private JacksonTester<List<GetFollowersResponse>> jsonFollowersList;
    private JacksonTester<List<GetFollowingsResponse>> jsonFollowingsList;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        JacksonTester.initFields(this, objectMapper);
        Mockito.reset(followService);
    }

    @Test
    @WithMockUser
    void testGetFollowers() throws Exception {
        String username = "testuser";
        GetFollowersResponse follower = new GetFollowersResponse();
        List<GetFollowersResponse> followersList = List.of(follower);

        given(followService.getFollowers(username)).willReturn(followersList);

        mvc.perform(get("/api/users/{username}/followers", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonFollowersList.write(followersList).getJson()));
    }

    @Test
    @WithMockUser
    void testGetFollowing() throws Exception {
        String username = "testuser";
        GetFollowingsResponse following = new GetFollowingsResponse();
        List<GetFollowingsResponse> followingsList = List.of(following);

        given(followService.getFollowing(username)).willReturn(followingsList);

        mvc.perform(get("/api/users/{username}/following", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonFollowingsList.write(followingsList).getJson()));
    }

    @Test
    @WithMockUser
    void testGetFollowStats() throws Exception {
        String username = "testuser";
        FollowStatsResponse stats = new FollowStatsResponse(10, 5);

        given(followService.getFollowStats(username)).willReturn(stats);

        mvc.perform(get("/api/users/{username}/follow-stats", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonStatsResponse.write(stats).getJson()));

    }

    @Test
    @WithMockUser
    void testFollowUser() throws Exception {
        String followerUsername = "user_who_follows";
        String followingUsername = "user_being_followed";
        FollowingFeatureResponse response = new FollowingFeatureResponse(followerUsername, followingUsername, 1);

        given(followService.followUser(followerUsername, followingUsername)).willReturn(response);

        mvc.perform(post("/api/users/{followerUsername}/follow/{followingUserName}", followerUsername, followingUsername)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonFollowResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testUnfollowUser() throws Exception {
        String followerUsername = "user_who_unfollows";
        String followingUsername = "user_being_unfollowed";
        FollowingFeatureResponse response = new FollowingFeatureResponse(followerUsername, followingUsername, 0);

        given(followService.unfollowUser(followerUsername, followingUsername)).willReturn(response);

        mvc.perform(delete("/api/users/{followerUsername}/unfollow/{followingUserName}", followerUsername, followingUsername)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonFollowResponse.write(response).getJson()));
    }
}
package com.example.CMPE451.controller;

import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.model.request.DeleteUserRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false) // Disables Security Filters (403/401 checks)
@AutoConfigureJsonTesters
class UserControllerTest {

    @Autowired
    private MockMvc mvc;

    // 1. Use @MockBean instead of manual @TestConfiguration
    // This mocks the UserService and injects it into the UserController
    @MockBean
    private UserService userService;

    // 2. Mock Security dependencies
    // Even though addFilters=false, Spring expects these beans to exist
    // if your main SecurityConfig class injects them.
    @MockBean
    private MyUserDetailsService myUserDetailsService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    // 3. Autowire JacksonTesters directly
    // @AutoConfigureJsonTesters does the setup; you don't need a @BeforeEach method
    @Autowired
    private JacksonTester<List<GetSavedPostResponse>> jsonSavedPosts;
    @Autowired
    private JacksonTester<List<GetPostResponse>> jsonPosts;
    @Autowired
    private JacksonTester<UserCountResponse> jsonUserCount;
    @Autowired
    private JacksonTester<List<BadgeResponse>> jsonBadges;
    @Autowired
    private JacksonTester<UserDeleteResponse> jsonDeleteResponse;

    // We need the ObjectMapper to serialize the Request Body in the delete tests
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void testGetSavedPosts() throws Exception {
        String username = "alice";
        GetSavedPostResponse post = new GetSavedPostResponse(
                1, "content", 10, 5,
                "alice", Timestamp.from(Instant.now()),
                "url", true, true
        );

        given(userService.getSavedPosts(username)).willReturn(List.of(post));

        mvc.perform(get("/api/users/{username}/saved-posts", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonSavedPosts.write(List.of(post)).getJson()));
    }

    @Test
    @WithMockUser
    void testGetPostsForUser() throws Exception {
        String username = "bob";
        GetPostResponse post = new GetPostResponse(
                1, "hello", Timestamp.from(Instant.now()),
                20, "bob", "url", 3, true, true
        );

        given(userService.getPostsForUser(username)).willReturn(List.of(post));

        mvc.perform(get("/api/users/{username}/posts", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonPosts.write(List.of(post)).getJson()));
    }

    @Test
    @WithMockUser
    void testGetUserCount() throws Exception {
        UserCountResponse response = new UserCountResponse(42L);
        given(userService.getUserCount()).willReturn(response);

        mvc.perform(get("/api/users/count")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonUserCount.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testGetBadges() throws Exception {
        BadgeResponse badge = new BadgeResponse("charlie", "EcoHero");

        given(userService.getBadges("charlie")).willReturn(List.of(badge));

        mvc.perform(get("/api/users/{username}/badges", "charlie")
                        .param("username", "charlie")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonBadges.write(List.of(badge)).getJson()));
    }

    @Test
    @WithMockUser
    void testDeleteUserSuccess() throws Exception {
        String username = "david";
        DeleteUserRequest req = new DeleteUserRequest("Ahmet123");
        UserDeleteResponse response = new UserDeleteResponse(5, username);

        given(userService.deleteUser(username, req)).willReturn(response);

        // Used 'objectMapper' here instead of 'new ObjectMapper()' to ensure consistency
        mvc.perform(delete("/api/users/{username}", username)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonDeleteResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testDeleteUserInvalidCredentials() throws Exception {
        String username = "test";
        DeleteUserRequest req = new DeleteUserRequest("ABCDE");

        // Make sure equals() is implemented in DeleteUserRequest or use refEq()
        // usually just mocking based on the method call is enough if args match
        given(userService.deleteUser(org.mockito.ArgumentMatchers.eq(username), org.mockito.ArgumentMatchers.any(DeleteUserRequest.class)))
                .willThrow(new InvalidCredentialsException("invalid"));

        mvc.perform(delete("/api/users/{username}", username)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void testDeleteUserInternalError() throws Exception {
        String username = "errorUser";
        DeleteUserRequest req = new DeleteUserRequest("aaaaa");

        doThrow(new RuntimeException("boom"))
                .when(userService).deleteUser(org.mockito.ArgumentMatchers.eq(username), org.mockito.ArgumentMatchers.any(DeleteUserRequest.class));

        mvc.perform(delete("/api/users/{username}", username)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isInternalServerError());
    }
}
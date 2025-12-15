package com.example.CMPE451.controller;

import com.example.CMPE451.model.WasteItem;
import com.example.CMPE451.model.request.AttendChallengeRequest;
import com.example.CMPE451.model.request.CreateChallengeRequest;
import com.example.CMPE451.model.request.LogChallengeRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.ChallengeService;
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

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChallengeController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class ChallengeControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ChallengeService challengeService;

    @MockBean
    private MyUserDetailsService myUserDetailsService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private ObjectMapper objectMapper;

    // Jackson Testers
    @Autowired
    private JacksonTester<LogChallengeResponse> jsonLogResponse;
    @Autowired
    private JacksonTester<UserChallengeLogsResponse> jsonUserLogsResponse;
    @Autowired
    private JacksonTester<ChallengeResponse> jsonChallengeResponse;
    @Autowired
    private JacksonTester<List<ChallengeInfoResponse>> jsonChallengeInfoList;
    @Autowired
    private JacksonTester<EndChallengeResponse> jsonEndResponse;
    @Autowired
    private JacksonTester<AttendChallengeResponse> jsonAttendResponse;
    @Autowired
    private JacksonTester<LeaveChallengeResponse> jsonLeaveResponse;
    @Autowired
    private JacksonTester<List<LeaderboardEntry>> jsonLeaderboardList;
    @Autowired
    private JacksonTester<List<ChallengesResponse>> jsonHomeChallengesList;
    @Autowired
    private JacksonTester<List<MyChallengeResponse>> jsonMyChallengesList;
    @Autowired
    private JacksonTester<List<WasteItem>> jsonWasteItemList;

    @Test
    @WithMockUser
    void testLogChallengeProgress() throws Exception {
        int challengeId = 1;
        LogChallengeRequest req = new LogChallengeRequest("alice", 20.0, 1);
        LogChallengeResponse response = new LogChallengeResponse("alice", challengeId, 50.0);

        given(challengeService.logChallengeProgress(eq(challengeId), any(LogChallengeRequest.class)))
                .willReturn(response);

        mvc.perform(post("/api/challenges/{id}/log", challengeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonLogResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testGetUserLogsForChallenge() throws Exception {
        int challengeId = 1;
        String username = "bob";
        UserChallengeLogsResponse response = new UserChallengeLogsResponse(username, challengeId, List.of());

        given(challengeService.getUserLogsForChallenge(challengeId, username)).willReturn(response);

        mvc.perform(get("/api/challenges/{id}/logs/{username}", challengeId, username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonUserLogsResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testCreateChallenge() throws Exception {
        CreateChallengeRequest req = new CreateChallengeRequest();
        // Set fields if needed: req.setTitle("Challenge");

        ChallengeResponse response = new ChallengeResponse(1, "Challenge1", 100.0, "desc",
                LocalDate.now(), LocalDate.now().plusDays(7), null, "type");

        given(challengeService.createChallenge(any(CreateChallengeRequest.class))).willReturn(response);

        mvc.perform(post("/api/challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonChallengeResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testGetAllChallenges() throws Exception {
        String username = "charlie";
        ChallengeInfoResponse info = new ChallengeInfoResponse(1, "Test", 10.0, "desc",
                LocalDate.now(), LocalDate.now().plusDays(5), null, "type", 5.0, true);

        given(challengeService.getAllChallenges(username)).willReturn(List.of(info));

        mvc.perform(get("/api/challenges/{username}", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonChallengeInfoList.write(List.of(info)).getJson()));
    }

    @Test
    @WithMockUser
    void testEndChallenge() throws Exception {
        int challengeId = 2;
        EndChallengeResponse response = new EndChallengeResponse(challengeId, true);

        given(challengeService.endChallenge(challengeId)).willReturn(response);

        mvc.perform(patch("/api/challenges/{id}", challengeId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonEndResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testAttendChallenge() throws Exception {
        int challengeId = 3;
        AttendChallengeRequest req = new AttendChallengeRequest();
        AttendChallengeResponse response = new AttendChallengeResponse("david", challengeId);

        given(challengeService.attendChallenge(any(AttendChallengeRequest.class), eq(challengeId)))
                .willReturn(response);

        mvc.perform(post("/api/challenges/{id}/attendees", challengeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonAttendResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testLeaveChallenge() throws Exception {
        int challengeId = 4;
        String username = "emma";
        LeaveChallengeResponse response = new LeaveChallengeResponse(username, challengeId, true);

        given(challengeService.leaveChallenge(username, challengeId)).willReturn(response);

        mvc.perform(delete("/api/challenges/{challengeId}/attendees/{username}", challengeId, username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonLeaveResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testGetChallengeLeaderboard() throws Exception {
        int challengeId = 5;
        LeaderboardEntry entry = new LeaderboardEntry("john", 42.0);
        given(challengeService.getLeaderboardForChallenge(challengeId)).willReturn(List.of(entry));

        mvc.perform(get("/api/challenges/{id}/leaderboard", challengeId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonLeaderboardList.write(List.of(entry)).getJson()));
    }

    @Test
    @WithMockUser
    void testGetAllChallengesForHome() throws Exception {
        ChallengesResponse challenge = new ChallengesResponse(1, "Home", 10.0, "desc",
                LocalDate.now(), LocalDate.now().plusDays(3), null, "type");
        given(challengeService.getAllChallengesForHomePage()).willReturn(List.of(challenge));

        mvc.perform(get("/api/challenges/homepage")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonHomeChallengesList.write(List.of(challenge)).getJson()));
    }

    @Test
    @WithMockUser
    void testGetAttendedChallenges() throws Exception {
        String username = "zoe";
        MyChallengeResponse challenge = new MyChallengeResponse(1, "MyCh", "desc", "type",
                null, 100.0, 50.0, 10.0);
        given(challengeService.getAttendedChallenges(username)).willReturn(List.of(challenge));

        mvc.perform(get("/api/challenges/{username}/attended", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonMyChallengesList.write(List.of(challenge)).getJson()));
    }

    @Test
    @WithMockUser
    void testGetWasteItemsForChallenge() throws Exception {
        int challengeId = 99;
        WasteItem item = new WasteItem();
        // item.setName("Plastic Bottle");

        given(challengeService.getWasteItemsForChallenge(challengeId)).willReturn(List.of(item));

        mvc.perform(get("/api/challenges/{id}/items", challengeId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonWasteItemList.write(List.of(item)).getJson()));
    }
}
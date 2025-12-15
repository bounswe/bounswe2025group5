package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.FeedbackRequest;
import com.example.CMPE451.model.response.FeedbackResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.FeedbackService;
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

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FeedbackController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class FeedbackControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private FeedbackService feedbackService;

    @MockBean
    private MyUserDetailsService myUserDetailsService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private JacksonTester<FeedbackResponse> jsonFeedbackResponse;

    @Autowired
    private JacksonTester<List<FeedbackResponse>> jsonFeedbackResponseList;

    @Autowired
    private JacksonTester<Map<String, Boolean>> jsonSuccessMap;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void testGetUnSeenFeedbacks() throws Exception {
        String username = "alice";
        FeedbackResponse response = new FeedbackResponse();

        List<FeedbackResponse> responseList = List.of(response);

        given(feedbackService.getUnSeenFeedbacks(username)).willReturn(responseList);

        mvc.perform(get("/api/feedback/unseen/{username}", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonFeedbackResponseList.write(responseList).getJson()));
    }

    @Test
    @WithMockUser
    void testWriteFeedback() throws Exception {
        FeedbackRequest request = new FeedbackRequest();

        FeedbackResponse response = new FeedbackResponse();

        given(feedbackService.writeFeedback(any(FeedbackRequest.class))).willReturn(response);

        mvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonFeedbackResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testMarkAsSeen() throws Exception {
        int feedbackId = 5;
        String username = "bob";

        doNothing().when(feedbackService).markFeedbackAsSeen(eq(feedbackId), eq(username));

        Map<String, Boolean> expectedResponse = Collections.singletonMap("success", true);

        mvc.perform(put("/api/feedback/seen/{feedbackId}/{username}", feedbackId, username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonSuccessMap.write(expectedResponse).getJson()));
    }
}
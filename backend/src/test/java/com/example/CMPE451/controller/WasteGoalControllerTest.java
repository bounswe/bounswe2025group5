package com.example.CMPE451.controller;

import com.example.CMPE451.model.WasteItem;
import com.example.CMPE451.model.request.CreateOrEditWasteGoalRequest;
import com.example.CMPE451.model.response.CreateWasteGoalResponse;
import com.example.CMPE451.model.response.DeleteWasteGoalResponse;
import com.example.CMPE451.model.response.GetWasteGoalResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.WasteGoalService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WasteGoalController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class WasteGoalControllerTest {

    @TestConfiguration
    static class WasteGoalControllerTestConfiguration {

        @Bean
        public WasteGoalService wasteGoalService() {
            return Mockito.mock(WasteGoalService.class);
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
    private WasteGoalService wasteGoalService;

    private JacksonTester<CreateOrEditWasteGoalRequest> jsonCreateOrEditRequest;
    private JacksonTester<List<GetWasteGoalResponse>> jsonGetGoalListResponse;
    private JacksonTester<CreateWasteGoalResponse> jsonCreateResponse;
    private JacksonTester<DeleteWasteGoalResponse> jsonDeleteResponse;
    private JacksonTester<List<WasteItem>> jsonWasteItemListResponse;

    private GetWasteGoalResponse goalResponse1;
    private CreateOrEditWasteGoalRequest createRequest;
    private CreateWasteGoalResponse createResponse;
    private WasteItem wasteItem1;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        objectMapper.configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        JacksonTester.initFields(this, objectMapper);

        Mockito.reset(wasteGoalService);

        goalResponse1 = new GetWasteGoalResponse();
        goalResponse1.setGoalId(1);
        goalResponse1.setCreatorUsername("testuser");
        goalResponse1.setWasteType("Plastic");
        goalResponse1.setCreatedAt(LocalDateTime.of(2023, 1, 1, 10, 0, 0));
        goalResponse1.setProgress(0.5);

        createRequest = new CreateOrEditWasteGoalRequest();
        createRequest.setType("Glass");
        createRequest.setRestrictionAmountGrams(1000.0);
        createRequest.setDuration(30);

        createResponse = new CreateWasteGoalResponse("testuser", 1);

        wasteItem1 = new WasteItem();
        wasteItem1.setId(101);
        wasteItem1.setName("plastic_bottle");
        wasteItem1.setDisplayName("Plastic Bottle");
    }

    @Test
    @WithMockUser
    void testGetGoals() throws Exception {
        List<GetWasteGoalResponse> mockGoals = List.of(goalResponse1);
        given(wasteGoalService.getWasteGoals(eq("testuser"), eq(10), eq(1L)))
                .willReturn(mockGoals);

        mvc.perform(get("/api/users/testuser/waste-goals")
                        .param("size", "10")
                        .param("lastGoalId", "1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonGetGoalListResponse.write(mockGoals).getJson()));
    }

    @Test
    @WithMockUser
    void testGetGoals_WhenLastGoalIdIsNull() throws Exception {
        // Arrange
        List<GetWasteGoalResponse> mockGoals = List.of(goalResponse1);
        given(wasteGoalService.getWasteGoals(eq("testuser"), eq(10), eq(null)))
                .willReturn(mockGoals);

        mvc.perform(get("/api/users/testuser/waste-goals")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonGetGoalListResponse.write(mockGoals).getJson()));
    }

    @Test
    @WithMockUser
    void testCreateWasteGoal() throws Exception {
        given(wasteGoalService.saveWasteGoal(any(CreateOrEditWasteGoalRequest.class), eq("testuser")))
                .willReturn(createResponse);

        mvc.perform(post("/api/users/testuser/waste-goals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(createRequest)) // Matching ChallengeControllerTest style
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCreateResponse.write(createResponse).getJson()));
    }

    @Test
    @WithMockUser
    void testEditWasteGoal() throws Exception {
        CreateOrEditWasteGoalRequest editRequest = new CreateOrEditWasteGoalRequest();
        editRequest.setRestrictionAmountGrams(500.0);
        editRequest.setDuration(15);
        editRequest.setType("Plastic");

        CreateWasteGoalResponse editResponse = new CreateWasteGoalResponse("testuser", 2);

        given(wasteGoalService.editWasteGoal(eq(2), any(CreateOrEditWasteGoalRequest.class)))
                .willReturn(editResponse);

        mvc.perform(put("/api/users/waste-goals/2") // <-- Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(editRequest)) // Matching ChallengeControllerTest style
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCreateResponse.write(editResponse).getJson()));
    }

    @Test
    @WithMockUser
    void testDeleteWasteGoal() throws Exception {
        Integer goalId = 5;
        DeleteWasteGoalResponse deleteResponse = new DeleteWasteGoalResponse(goalId);
        doNothing().when(wasteGoalService).deleteWasteGoal(goalId);

        mvc.perform(delete("/api/users/waste-goals/5") // <-- Corrected URL
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonDeleteResponse.write(deleteResponse).getJson()));
    }

    @Test
    @WithMockUser
    void testGetWasteItemsForGoal() throws Exception {
        Integer goalId = 1;
        List<WasteItem> mockItems = List.of(wasteItem1);
        given(wasteGoalService.getWasteItemsForGoalType(goalId)).willReturn(mockItems);

        mvc.perform(get("/api/users/waste-goals/1/items") // <-- Corrected URL
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonWasteItemListResponse.write(mockItems).getJson()));
    }
}
package com.example.CMPE451.controller;

import com.example.CMPE451.model.WasteItem;
import com.example.CMPE451.model.WasteType;
import com.example.CMPE451.model.request.CreateWasteLogRequest;
import com.example.CMPE451.model.request.UpdateWasteLogRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.WasteLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WasteLogController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class WasteLogControllerTest {


    @TestConfiguration
    static class WasteLogControllerTestConfiguration {

        @Bean
        public WasteLogService wasteLogService() {
            return Mockito.mock(WasteLogService.class);
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
    private WasteLogService wasteLogService;

    private JacksonTester<List<GetWasteLogResponse>> jsonGetLogsResponse;
    private JacksonTester<CreateWasteLogRequest> jsonCreateLogRequest;
    private JacksonTester<CreateOrEditWasteLogResponse> jsonCreateOrEditResponse;
    private JacksonTester<UpdateWasteLogRequest> jsonUpdateLogRequest;
    private JacksonTester<DeleteWasteLogResponse> jsonDeleteResponse;
    private JacksonTester<TotalLogResponse> jsonTotalLogResponse;
    private JacksonTester<WasteLogMonthlyResponse> jsonMonthlyResponse;


    private GetWasteLogResponse logResponse1;
    private CreateWasteLogRequest createRequest;
    private CreateOrEditWasteLogResponse createResponse;
    private UpdateWasteLogRequest updateRequest;
    private CreateOrEditWasteLogResponse updateResponse;
    private DeleteWasteLogResponse deleteResponse;
    private TotalLogResponse totalResponse;
    private WasteLogMonthlyResponse monthlyResponse;
    private WasteItem wasteItem1;
    private WasteType wasteType1;
    private LocalDateTime testDate;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        objectMapper.configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        JacksonTester.initFields(this, objectMapper);

        Mockito.reset(wasteLogService);

        testDate = LocalDateTime.of(2023, 1, 1, 10, 0, 0);

        wasteItem1 = new WasteItem();
        wasteItem1.setId(101);
        wasteItem1.setName("plastic_bottle");
        wasteItem1.setDisplayName("Plastic Bottle");
        wasteItem1.setWeightInGrams(50.0);

        wasteType1 = new WasteType();
        wasteType1.setId(1);
        wasteType1.setName("Plastic");

        logResponse1 = new GetWasteLogResponse(1, testDate, 1, "testuser", wasteItem1);

        createRequest = new CreateWasteLogRequest("test_user", 2, 4);
        createResponse = new CreateOrEditWasteLogResponse(1, "Plastic Bottle", 2, testDate);

        updateRequest = new UpdateWasteLogRequest(5);
        updateResponse = new CreateOrEditWasteLogResponse(1, "Plastic Bottle", 5, testDate);

        deleteResponse = new DeleteWasteLogResponse(1);

        totalResponse = new TotalLogResponse(wasteType1, 1500.0);

        List<MonthlyWasteData> monthlyData = List.of(new MonthlyWasteData(2025, 10,10.0));
        monthlyResponse = new WasteLogMonthlyResponse("testuser", "Plastic", monthlyData);
    }


    @Test
    @WithMockUser
    void testGetLogs() throws Exception {
        List<GetWasteLogResponse> mockLogs = List.of(logResponse1);
        given(wasteLogService.getWasteLogsForGoal(1)).willReturn(mockLogs);

        mvc.perform(get("/api/waste-goals/1/logs")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonGetLogsResponse.write(mockLogs).getJson()));
    }

    @Test
    @WithMockUser
    void testCreateWasteLog() throws Exception {
        given(wasteLogService.createWasteLog(any(CreateWasteLogRequest.class), eq(1)))
                .willReturn(createResponse);

        mvc.perform(post("/api/waste-goals/1/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(createRequest))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCreateOrEditResponse.write(createResponse).getJson()));
    }

    @Test
    @WithMockUser
    void testUpdateWasteLog() throws Exception {

        given(wasteLogService.updateWasteLog(eq(1), any(UpdateWasteLogRequest.class)))
                .willReturn(updateResponse);

        mvc.perform(put("/api/logs/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(updateRequest))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCreateOrEditResponse.write(updateResponse).getJson()));
    }

    @Test
    @WithMockUser
    void testDeleteWasteLog() throws Exception {
        given(wasteLogService.deleteWasteLog(1)).willReturn(deleteResponse);

        mvc.perform(delete("/api/logs/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonDeleteResponse.write(deleteResponse).getJson()));
    }

    @Test
    @WithMockUser
    void testTotalLogAmountForInterval() throws Exception {
        LocalDateTime startDate = LocalDateTime.of(2023, 1, 1, 0, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2023, 1, 31, 23, 59, 59);
        String wasteType = "Plastic";

        given(wasteLogService.getTotalWasteAmountByTypeAndInterval(wasteType, startDate, endDate))
                .willReturn(totalResponse);

        mvc.perform(get("/api/logs/summary")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .param("wasteType", wasteType)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonTotalLogResponse.write(totalResponse).getJson()));
    }

    @Test
    @WithMockUser
    void testLogsForUserPerMonth() throws Exception {
        String username = "testuser";
        String wasteType = "Plastic";
        given(wasteLogService.getLogsForUserPerMonth(username, wasteType)).willReturn(monthlyResponse);

        mvc.perform(get("/api/logs/testuser/monthly")
                        .param("wasteType", wasteType)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonMonthlyResponse.write(monthlyResponse).getJson()));
    }

}

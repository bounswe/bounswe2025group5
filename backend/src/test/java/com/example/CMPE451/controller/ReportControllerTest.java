package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.CreateReportRequest;
import com.example.CMPE451.model.response.CreateReportResponse;
import com.example.CMPE451.model.response.GetReportResponse;
import com.example.CMPE451.model.response.MarkResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.ReportService;
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

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class ReportControllerTest {

    @TestConfiguration
    static class ReportControllerTestConfiguration {

        @Bean
        public ReportService reportService() {
            return Mockito.mock(ReportService.class);
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
    private ReportService reportService;

    private JacksonTester<CreateReportResponse> jsonCreateReportResponse;
    private JacksonTester<List<GetReportResponse>> jsonGetReportResponseList;
    private JacksonTester<MarkResponse> jsonMarkResponse;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        objectMapper.configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        JacksonTester.initFields(this, objectMapper);
        Mockito.reset(reportService);
    }

    @Test
    @WithMockUser
    void testCreateReport() throws Exception {
        CreateReportRequest req = new CreateReportRequest();

        CreateReportResponse response = new CreateReportResponse(true);

        given(reportService.createReport(any(CreateReportRequest.class))).willReturn(response);

        mvc.perform(post("/api/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(req))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCreateReportResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testGetUnSolvedReports() throws Exception {
        GetReportResponse report = new GetReportResponse(
                1,
                "testUser",
                "Spam",
                "Bad content",
                0,
                "Post",
                101,
                Timestamp.from(Instant.now())
        );

        List<GetReportResponse> responseList = List.of(report);

        given(reportService.getUnreadReports()).willReturn(responseList);

        mvc.perform(get("/api/reports/unread")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonGetReportResponseList.write(responseList).getJson()));
    }

    @Test
    @WithMockUser
    void testSolveReport() throws Exception {
        int reportId = 1;
        MarkResponse response = new MarkResponse(true, reportId);

        given(reportService.markReportAsSolved(reportId)).willReturn(response);

        mvc.perform(put("/api/reports/{id}/solve-flag", reportId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonMarkResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testMarkAsDeletion() throws Exception {
        int reportId = 2;
        MarkResponse response = new MarkResponse(true, reportId);

        given(reportService.markReportAsDeleted(reportId)).willReturn(response);

        mvc.perform(put("/api/reports/{id}/delete-flag", reportId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonMarkResponse.write(response).getJson()));
    }
}
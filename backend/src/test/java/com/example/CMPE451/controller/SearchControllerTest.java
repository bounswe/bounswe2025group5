package com.example.CMPE451.controller;

import com.example.CMPE451.model.response.GetPostResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.ForumSearchService;
import com.example.CMPE451.service.PostService;
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
import java.util.Collections;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SearchController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class SearchControllerTest {

    @Autowired
    private MockMvc mvc;


    @MockBean
    private ForumSearchService forumSearchService;

    @MockBean
    private PostService postService;

    @MockBean
    private MyUserDetailsService myUserDetailsService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private JacksonTester<List<GetPostResponse>> jsonPostList;

    @Test
    @WithMockUser
    void testSearchPostsSemantic() throws Exception {
        // Input Data
        String query = "climate change";
        String username = "alice";
        String language = "en";

        // Expected Response Data
        GetPostResponse post = new GetPostResponse(
                101,
                "Analysis of climate change data",
                Timestamp.from(Instant.now()),
                50,
                "creatorBob",
                "http://img.com/chart.png",
                5,
                false,
                true
        );
        List<GetPostResponse> responseList = List.of(post);


        given(postService.semanticSearch(query, username))
                .willReturn(responseList);

        mvc.perform(get("/api/forum/search/semantic")
                        .param("query", query)
                        .param("username", username)
                        .param("lang", language)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonPostList.write(responseList).getJson()));
    }

    @Test
    @WithMockUser
    void testSearchPostsSemanticEmptyResult() throws Exception {
        String query = "unknown topic";
        String username = "alice";

        given(postService.semanticSearch(query, username))
                .willReturn(Collections.emptyList());

        mvc.perform(get("/api/forum/search/semantic")
                        .param("query", query)
                        .param("username", username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
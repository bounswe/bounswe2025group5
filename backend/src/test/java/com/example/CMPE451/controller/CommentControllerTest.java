package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.CommentRequest;
import com.example.CMPE451.model.response.CommentResponse;
import com.example.CMPE451.model.response.GetCommentsResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.CommentService;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.json.JacksonTester;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommentController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class CommentControllerTest {

    @TestConfiguration
    static class Config {

        @Bean
        public CommentService commentService() {
            return Mockito.mock(CommentService.class);
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
    private CommentService commentService;

    private JacksonTester<CommentResponse> jsonCommentResponse;
    private JacksonTester<GetCommentsResponse> jsonGetCommentsResponse;
    private JacksonTester<Map<String, Boolean>> jsonDeleteResponse;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        JacksonTester.initFields(this, mapper);

        Mockito.reset(commentService);
    }


    @Test
    @WithMockUser
    void testAddComment() throws Exception {
        Integer postId = 10;

        CommentRequest request = new CommentRequest();
        request.setUsername("john");
        request.setContent("Nice post!");

        CommentResponse response = new CommentResponse(
                1,
                "Nice post!",
                Timestamp.from(Instant.now()),
                "john"
        );

        given(commentService.addComment(request, postId)).willReturn(response);

        mvc.perform(post("/api/posts/{postId}/comments", postId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCommentResponse.write(response).getJson()));
    }


    @Test
    @WithMockUser
    void testGetCommentsForPost() throws Exception {
        Integer postId = 10;

        CommentResponse c = new CommentResponse(
                1,
                "hello",
                Timestamp.from(Instant.now()),
                "john"
        );

        GetCommentsResponse response = new GetCommentsResponse(
                postId,
                1,
                List.of(c)
        );

        given(commentService.getCommentsForPost(postId)).willReturn(response);

        mvc.perform(get("/api/posts/{postId}/comments", postId))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonGetCommentsResponse.write(response).getJson()));
    }


    @Test
    @WithMockUser
    void testUpdateComment() throws Exception {
        Integer commentId = 5;

        CommentRequest request = new CommentRequest();
        request.setContent("updated content");
        request.setUsername("john");

        CommentResponse response = new CommentResponse(
                commentId,
                "updated content",
                Timestamp.from(Instant.now()),
                "john"
        );

        given(commentService.updateComment(commentId, request)).willReturn(response);

        mvc.perform(put("/api/posts/comment/{commentId}", commentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCommentResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testDeleteComment() throws Exception {
        Integer commentId = 3;

        Map<String, Boolean> response = Map.of("success", true);

        given(commentService.deleteComment(commentId)).willReturn(response);

        mvc.perform(delete("/api/posts/comment/{commentId}", commentId))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonDeleteResponse.write(response).getJson()));

        verify(commentService).deleteComment(commentId);
    }
}
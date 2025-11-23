package com.example.CMPE451.controller;

import com.example.CMPE451.controller.PostLikeController;
import com.example.CMPE451.model.request.PostLikeRequest;
import com.example.CMPE451.model.response.PostLikeResponse;
import com.example.CMPE451.model.response.UserResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.service.PostLikeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PostLikeController.class)
@AutoConfigureMockMvc(addFilters = false)
class PostLikeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PostLikeService postLikeService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;


    @Test
    void testAddLike() throws Exception {
        when(postLikeService.addLike(eq("bartu"), eq(10)))
                .thenReturn(Map.of("success", true));

        String body = """
                {
                    "username": "bartu",
                    "postId": 10
                }
                """;

        mockMvc.perform(post("/api/posts/like")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testRemoveLike() throws Exception {
        when(postLikeService.removeLike(eq("bartu"), eq(10)))
                .thenReturn(Map.of("success", true));

        String body = """
                {
                    "username": "bartu",
                    "postId": 10
                }
                """;

        mockMvc.perform(delete("/api/posts/like")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testGetPostLikes() throws Exception {
        PostLikeResponse response = new PostLikeResponse(
                10,                   // postId
                5,                    // like count
                List.of(new UserResponse(1, "bartu"))
        );

        when(postLikeService.getPostLikes(eq(10))).thenReturn(response);

        mockMvc.perform(get("/api/posts/10/likes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postId").value(10))
                .andExpect(jsonPath("$.totalLikes").value(5))
                .andExpect(jsonPath("$.likedByUsers[0].username").value("bartu"));
    }
}

package com.example.CMPE451;

import com.example.CMPE451.controller.SearchController;
import com.example.CMPE451.model.response.GetPostResponse;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.service.ForumSearchService;
import com.example.CMPE451.service.PostService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(SearchController.class)
class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ForumSearchService forumSearchService;
    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @MockBean
    private PostService postService;

    @Test
    void testSearchPostsSemantic() throws Exception {
        GetPostResponse resp = new GetPostResponse();
        resp.setPostId(10);
        resp.setContent("test post");

        when(postService.semanticSearch(eq("hello"), eq("bartu")))
                .thenReturn(List.of(resp));

        mockMvc.perform(get("/api/forum/search/semantic")
                        .param("query", "hello")
                        .param("username", "bartu")
                        .param("lang", "en")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].postId").value(10))
                .andExpect(jsonPath("$[0].content").value("test post"));
    }
}

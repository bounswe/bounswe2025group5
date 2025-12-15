package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.SavePostRequest;
import com.example.CMPE451.model.response.*;
import com.example.CMPE451.security.JwtAuthFilter;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.PostService;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.json.JacksonTester;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PostController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class PostControllerTest {

    @TestConfiguration
    static class PostControllerTestConfiguration {

        @Bean
        public PostService postService() {
            return Mockito.mock(PostService.class);
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
    private PostService postService;

    private JacksonTester<List<GetPostResponse>> jsonPostsList;
    private JacksonTester<CreateOrEditPostResponse> jsonCreateOrEditResponse;
    private JacksonTester<DeletePostResponse> jsonDeleteResponse;
    private JacksonTester<SavePostResponse> jsonSaveResponse;
    private JacksonTester<Map<String, Boolean>> jsonDeleteSavedResponse;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        JacksonTester.initFields(this, objectMapper);
        Mockito.reset(postService);
    }

    @Test
    @WithMockUser
    void testGetPosts() throws Exception {
        GetPostResponse post = new GetPostResponse(1, "Post content",
                new Timestamp(System.currentTimeMillis()), 10, "testuser", null, 2, true, false,"https://example.com");
        List<GetPostResponse> posts = List.of(post);

        given(postService.getPosts("testuser", 10, null)).willReturn(posts);

        mvc.perform(get("/api/posts")
                        .param("username", "testuser")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonPostsList.write(posts).getJson()));
    }

    @Test
    @WithMockUser
    void testCreatePost() throws Exception {
        MockMultipartFile photoFile =
                new MockMultipartFile("photoFile", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, "dummy".getBytes());
        CreateOrEditPostResponse response = new CreateOrEditPostResponse(
                1, "New post", new Timestamp(System.currentTimeMillis()), "testuser", "photo.jpg","https://example.com");

        given(postService.createPost("New post", "testuser", photoFile)).willReturn(response);

        mvc.perform(multipart("/api/posts")
                        .file(photoFile)
                        .param("content", "New post")
                        .param("username", "testuser"))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCreateOrEditResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testEditPost() throws Exception {
        Integer postId = 1;
        MockMultipartFile photoFile =
                new MockMultipartFile("photoFile", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, "dummy".getBytes());
        CreateOrEditPostResponse response = new CreateOrEditPostResponse(
            postId, "Edited post", new Timestamp(System.currentTimeMillis()), "testuser", "photo.jpg","https://example.com");

        given(postService.editPost(postId, "Edited post", "testuser", photoFile)).willReturn(response);

        mvc.perform(multipart("/api/posts/{postId}", postId)
                        .file(photoFile)
                        .param("content", "Edited post")
                        .param("username", "testuser")
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonCreateOrEditResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testDeletePost() throws Exception {
        Integer postId = 1;

        mvc.perform(delete("/api/posts/{postId}", postId))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonDeleteResponse.write(new DeletePostResponse(postId)).getJson()));

        verify(postService).deletePost(postId);
    }

    @Test
    @WithMockUser
    void testGetMostLikedPosts() throws Exception {
        GetPostResponse post = new GetPostResponse(1, "Popular post",
                new Timestamp(System.currentTimeMillis()), 500, "popularUser", null, 20, true, true,"https://example.com");
        List<GetPostResponse> posts = List.of(post);

        given(postService.getMostLikedPosts(5, "popularUser")).willReturn(posts);

        mvc.perform(get("/api/posts/mostLiked")
                        .param("size", "5")
                        .param("username", "popularUser")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonPostsList.write(posts).getJson()));
    }

    @Test
    @WithMockUser
    void testSavePost() throws Exception {
        Integer postId = 1;
        SavePostRequest request = new SavePostRequest();
        SavePostResponse response = new SavePostResponse("testuser", postId);

        given(postService.savePost(request, postId)).willReturn(response);

        mvc.perform(post("/api/posts/{postId}/save", postId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(request))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonSaveResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testDeleteSavedPost() throws Exception {
        Integer postId = 1;
        String username = "testuser";
        Map<String, Boolean> response = Map.of("deleted", true);

        given(postService.deleteSavedPost(username, postId)).willReturn(response);

        mvc.perform(delete("/api/posts/{postId}/saves/{username}", postId, username)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonDeleteSavedResponse.write(response).getJson()));
    }

    @Test
    @WithMockUser
    void testSearchPosts() throws Exception {
        GetPostResponse post = new GetPostResponse(1, "search result",
                new Timestamp(System.currentTimeMillis()), 10, "testuser", null, 1, false, false,"https://example.com");
        List<GetPostResponse> posts = List.of(post);

        given(postService.semanticSearch("query", "testuser")).willReturn(posts);

        mvc.perform(get("/api/posts/search")
                        .param("q", "query")
                        .param("username", "testuser")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonPostsList.write(posts).getJson()));
    }
}

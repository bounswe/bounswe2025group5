package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.LoginRequest;
import com.example.CMPE451.model.request.RegisterRequest;
import com.example.CMPE451.model.request.TokenRequest;
import com.example.CMPE451.model.response.LoginResponse;
import com.example.CMPE451.model.response.RegisterResponse;
import com.example.CMPE451.repository.RefreshTokenRepository;
import com.example.CMPE451.repository.UserRepository;
import com.example.CMPE451.security.MyUserDetailsService;
import com.example.CMPE451.service.AuthService;
import com.example.CMPE451.service.JwtService;
import com.example.CMPE451.service.RefreshTokenService;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureJsonTesters
class AuthControllerTest {


    @TestConfiguration
    static class AuthControllerTestConfiguration {



        @Bean
        public AuthService authService() {
            return Mockito.mock(AuthService.class);
        }

        @Bean
        public MyUserDetailsService myUserDetailsService() {
            return Mockito.mock(MyUserDetailsService.class);
        }

        @Bean
        public JwtService jwtService() {
            return Mockito.mock(JwtService.class);
        }

        @Bean
        public UserRepository userRepository() {
            return Mockito.mock(UserRepository.class);
        }

        @Bean
        public RefreshTokenRepository refreshTokenRepository() {
            return Mockito.mock(RefreshTokenRepository.class);
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
            return Mockito.mock(PasswordEncoder.class);
        }

        @Bean
        public RefreshTokenService refreshTokenService() {
            return Mockito.mock(RefreshTokenService.class);
        }


    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private AuthService authService;

    private JacksonTester<LoginRequest> jsonLoginRequest;
    private JacksonTester<RegisterRequest> jsonRegisterRequest;
    private JacksonTester<TokenRequest> jsonTokenRequest;

    private JacksonTester<LoginResponse> jsonLoginResponse;
    private JacksonTester<RegisterResponse> jsonRegisterResponse;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        objectMapper.configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        JacksonTester.initFields(this, objectMapper);

        Mockito.reset(authService);

    }

    @Test
    void testLogin() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername("testuser");
        loginRequest.setPassword("password123");

        LoginResponse loginResponse = new LoginResponse(
                "fake-jwt-token",
                "fake-refresh-token",
                1,
                "testuser",
                false,
                false
        );

        given(authService.login(any(LoginRequest.class))).willReturn(loginResponse);

        mvc.perform(post("/api/sessions") // Updated path
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonLoginRequest.write(loginRequest).getJson())
                        .accept(MediaType.APPLICATION_JSON)) // Added accept header
                .andExpect(status().isOk())
                .andExpect(content().json(jsonLoginResponse.write(loginResponse).getJson()));
    }

    @Test
    void testRegister() throws Exception {
        RegisterRequest registerRequest =
                new RegisterRequest("newuser", "newpass123", "new@example.com");

        RegisterResponse registerResponse =
                new RegisterResponse("User registered successfully", "newuser", "new@example.com");

        given(authService.register(any(RegisterRequest.class))).willReturn(registerResponse);

        mvc.perform(post("/api/users") // Updated path
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRegisterRequest.write(registerRequest).getJson())
                        .accept(MediaType.APPLICATION_JSON)) // Added accept header
                .andExpect(status().isOk())
                .andExpect(content().json(jsonRegisterResponse.write(registerResponse).getJson()));
    }

    @Test
    void testRefreshToken() throws Exception {
        TokenRequest tokenRequest = new TokenRequest();
        tokenRequest.setRefreshToken("my-old-refresh-token");

        LoginResponse loginResponse = new LoginResponse(
                "new-fake-jwt-token",
                "new-fake-refresh-token",
                1,
                "testuser",
                false,
                false
        );

        given(authService.refreshAccessToken(tokenRequest.getRefreshToken())).willReturn(loginResponse);

        mvc.perform(post("/api/refresh-token") // Path from controller
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonTokenRequest.write(tokenRequest).getJson())
                        .accept(MediaType.APPLICATION_JSON)) // Added accept header
                .andExpect(status().isOk())
                .andExpect(content().json(jsonLoginResponse.write(loginResponse).getJson()));
    }
}
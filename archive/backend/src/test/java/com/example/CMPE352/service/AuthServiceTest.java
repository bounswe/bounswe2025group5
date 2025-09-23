package com.example.CMPE352.service;


import com.example.CMPE352.exception.InvalidCredentialsException;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.request.LoginRequest;
import com.example.CMPE352.model.request.RegisterRequest;
import com.example.CMPE352.model.response.LoginResponse;
import com.example.CMPE352.model.response.RegisterResponse;
import com.example.CMPE352.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void registerSuccessfulRegistrationReturnsResponse() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setUsername("testUser");
        request.setPassword("password");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("testUser")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("hashed_pw");

        RegisterResponse response = authService.register(request);

        assertEquals("User registered successfully", response.getMessage());
        assertEquals("testUser", response.getUsername());
        assertEquals("test@example.com", response.getEmail());

        verify(userRepository, times(1)).save(any(User.class));
    }
    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");
        request.setUsername("newUser");
        request.setPassword("password");
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.register(request)
        );

        assertEquals("Email is already in use", exception.getMessage());
    }

    @Test
    void register_UsernameAlreadyExists_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("unique@example.com");
        request.setUsername("existingUser");
        request.setPassword("password");
        when(userRepository.existsByEmail("unique@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("existingUser")).thenReturn(true);

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.register(request)
        );

        assertEquals("Username is already taken", exception.getMessage());
    }

    @Test
    void login_Successful_ReturnsLoginResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmailOrUsername("testUser");
        request.setPassword("password");

        User user = new User("test@example.com", "testUser", "hashed_pw");
        user.setIsAdmin(false);
        user.setIsModerator(true);

        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashed_pw")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("token123");

        LoginResponse response = authService.login(request);

        assertEquals("token123", response.getToken());
        assertEquals("testUser", response.getUsername());
        assertFalse(response.getIsAdmin());
        assertTrue(response.getIsModerator());
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        LoginRequest request = new LoginRequest();
        request.setEmailOrUsername("notExist");
        request.setPassword("password");

        when(userRepository.findByUsername("notExist")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        LoginRequest request = new LoginRequest();
        request.setEmailOrUsername("testUser");
        request.setPassword("wrong_pw");

        User user = new User("test@example.com", "testUser", "hashed_pw");
        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_pw", "hashed_pw")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }
}
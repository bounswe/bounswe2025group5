package com.example.CMPE352.controller;


import com.example.CMPE352.model.request.LoginRequest;
import com.example.CMPE352.model.request.RegisterRequest;
import com.example.CMPE352.model.response.LoginResponse;
import com.example.CMPE352.model.response.RegisterResponse;
import com.example.CMPE352.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:19006")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
}
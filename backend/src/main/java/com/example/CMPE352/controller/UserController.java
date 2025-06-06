package com.example.CMPE352.controller;

import com.example.CMPE352.model.response.UserCountResponse;
import com.example.CMPE352.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/count")
    public ResponseEntity<UserCountResponse> getUserCount() {
        UserCountResponse count = userService.getUserCount();
        return ResponseEntity.ok(count);
    }
}
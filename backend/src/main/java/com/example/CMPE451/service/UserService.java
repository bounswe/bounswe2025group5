package com.example.CMPE451.service;

import com.example.CMPE451.model.response.UserCountResponse;
import com.example.CMPE451.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserCountResponse getUserCount() {
        long count = userRepository.countAllUsers();
        return  new UserCountResponse(count);
    }
}
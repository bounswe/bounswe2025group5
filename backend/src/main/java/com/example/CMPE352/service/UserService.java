package com.example.CMPE352.service;

import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public long getUserCount() {
        return userRepository.countAllUsers();
    }
}
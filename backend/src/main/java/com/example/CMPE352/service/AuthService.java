package com.example.CMPE352.service;


import com.example.CMPE352.exception.InvalidCredentialsException;
import com.example.CMPE352.model.request.LoginRequest;
import com.example.CMPE352.model.request.RegisterRequest;
import com.example.CMPE352.model.response.LoginResponse;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.response.RegisterResponse;
import com.example.CMPE352.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    @Autowired
    private final UserRepository userRepository;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        String individual = request.getEmailOrUsername();
        Optional<User> identifier;

        if (individual.contains("@")) {
            identifier = userRepository.findByEmail(individual);
        } else {
            identifier = userRepository.findByUsername(individual);
        }

        User user = identifier.orElseThrow(() ->
                new InvalidCredentialsException("Invalid email/username or password"));
        ;

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email/username or password");
        }

        String token = jwtService.generateToken(user);

        return new LoginResponse(token, user.getUsername(), user.getIsAdmin(), user.getIsModerator());
    }

    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidCredentialsException("Email is already in use");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new InvalidCredentialsException("Username is already taken");
        }
        User newUser = new User(
                request.getEmail(),
                request.getUsername(),
                passwordEncoder.encode(request.getPassword())
        );
        userRepository.save(newUser);

        return new RegisterResponse("User registered successfully", newUser.getUsername(), newUser.getEmail());
    }
}


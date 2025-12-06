package com.example.CMPE451.service;

import com.example.CMPE451.exception.ConflictException;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.request.ResetPasswordRequest;
import org.springframework.transaction.annotation.Transactional;
import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.model.RefreshToken;
import com.example.CMPE451.model.request.LoginRequest;
import com.example.CMPE451.model.request.RegisterRequest;
import com.example.CMPE451.model.response.LoginResponse;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.response.RegisterResponse;
import com.example.CMPE451.repository.RefreshTokenRepository;
import com.example.CMPE451.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class AuthService {

    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private final RefreshTokenRepository refreshTokenRepository ;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private final JwtService jwtService;
    @Autowired
    private RefreshTokenService refreshTokenService;

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
        String refreshToken = refreshTokenService.generateRefreshToken(user);

        return new LoginResponse(token,refreshToken, user.getId(),user.getUsername(), user.getIsAdmin(), user.getIsModerator());
    }

    public LoginResponse refreshAccessToken(String refreshToken) {
        RefreshToken tokenRecord = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new  NotFoundException("Refresh token not found: " + refreshToken));

        if (tokenRecord.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.deleteByEmail(tokenRecord.getEmail());
            throw  new InvalidCredentialsException("Refresh token is expired, please login again");
        }

        User user = userRepository.findByEmail(tokenRecord.getEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));

        String newAccessToken = jwtService.generateToken(user);

        refreshTokenRepository.deleteByEmail(user.getEmail());
        String newRefreshToken = refreshTokenService.generateRefreshToken(user);
        return new LoginResponse(
                newAccessToken,
                newRefreshToken,
                user.getId(),
                user.getUsername(),
                user.getIsAdmin(),
                user.getIsModerator()
        );
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



    public Map<String, Boolean> resetPassword(ResetPasswordRequest request) {
        String individual = request.getEmailOrUsername();
        Optional<User> identifier;

        if (individual.contains("@")) {
            identifier = userRepository.findByEmail(individual);
        } else {
            identifier = userRepository.findByUsername(individual);
        }

        User user = identifier.orElseThrow(() ->
                new NotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new ConflictException("The new and old password are the same");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));

        userRepository.save(user);
        return new HashMap<>() {{
            put("success", true);
        }};
    }
}



package com.example.CMPE451.service;

import com.example.CMPE451.model.RefreshToken;
import com.example.CMPE451.model.User;
import com.example.CMPE451.repository.RefreshTokenRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Autowired
    private final RefreshTokenRepository refreshTokenRepository;


    public String generateRefreshToken(User user) {
        String token = Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 30L * 24 * 60 * 60 * 1000))
                .signWith(Keys.secretKeyFor(SignatureAlgorithm.HS256))
                .compact();
        refreshTokenRepository.deleteByEmail(user.getEmail());
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .email(user.getEmail())
                .expiryDate(Instant.now().plusSeconds(30L * 24 * 60 * 60))
                .build();
        refreshTokenRepository.save(refreshToken);
        return  token;
    }
}

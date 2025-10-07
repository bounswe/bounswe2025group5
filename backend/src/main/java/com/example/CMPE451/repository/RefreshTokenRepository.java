package com.example.CMPE451.repository;

import com.example.CMPE451.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;


public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    @Transactional
    @Modifying
    void deleteByEmail(String email);
}

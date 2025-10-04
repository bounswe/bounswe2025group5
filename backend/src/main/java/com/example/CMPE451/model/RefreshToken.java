package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {



    @Column(nullable = false, unique = true)
    private String token;

    @Id
    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private Instant expiryDate;
}

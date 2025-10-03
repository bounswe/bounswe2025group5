package com.example.CMPE451.repository;

import com.example.CMPE451.model.User;
import com.example.CMPE451.model.Profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Integer> {
    Optional<Profile> findByUser(User user);
}

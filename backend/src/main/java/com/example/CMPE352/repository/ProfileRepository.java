package com.example.CMPE352.repository;

import com.example.CMPE352.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Integer> {
    Profile findByUserId(Integer userId);
}

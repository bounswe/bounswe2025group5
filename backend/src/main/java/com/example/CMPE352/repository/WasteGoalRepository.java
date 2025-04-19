package com.example.CMPE352.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.CMPE352.model.WasteGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WasteGoalRepository extends JpaRepository<WasteGoal, Integer> {
    Page<WasteGoal> findByOwnerId(Integer userId, Pageable pageable);

}

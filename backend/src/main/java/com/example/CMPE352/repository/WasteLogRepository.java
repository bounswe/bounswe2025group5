package com.example.CMPE352.repository;

import com.example.CMPE352.model.WasteLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WasteLogRepository extends JpaRepository<WasteLog, Integer> {
    Page<WasteLog> findByUserId(Integer userId, Pageable pageable);

    List<WasteLog> findAllByGoal_GoalId(Integer goalGoalId);
}


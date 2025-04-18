package com.example.CMPE352.service;

import com.example.CMPE352.exception.AccessDeniedException;
import com.example.CMPE352.model.*;
import com.example.CMPE352.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WasteLogService {

    private final WasteLogRepository wasteLogRepository;
    private final WasteGoalRepository wasteGoalRepository;
    private final UserRepository userRepository;

    public WasteLogService(WasteLogRepository wasteLogRepository,
                           WasteGoalRepository wasteGoalRepository,
                           UserRepository userRepository) {
        this.wasteLogRepository = wasteLogRepository;
        this.wasteGoalRepository = wasteGoalRepository;
        this.userRepository = userRepository;
    }

    public WasteLog saveLog(String username, WasteLog log) {
        User user = userRepository.findByUsername(username).orElseThrow();
        WasteGoal goal = wasteGoalRepository.findById(log.getGoal().getGoalId()).orElseThrow();

        if (!goal.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to log to this goal.");
        }

        log.setUser(user);
        log.setGoal(goal);
        log.setDate(LocalDateTime.now());

        WasteLog savedLog = wasteLogRepository.save(log);

        // Check if goal is now completed
        List<WasteLog> allLogs = wasteLogRepository.findAllByGoal_GoalId(goal.getGoalId());
        double totalLogged = allLogs.stream().mapToDouble(WasteLog::getAmount).sum();

        if (totalLogged >= goal.getAmount() && !goal.isCompleted()) {
            goal.setCompleted(true);
            wasteGoalRepository.save(goal);
        }

        return savedLog;
    }

    public Page<WasteLog> getUserLogs(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return wasteLogRepository.findByUserId(user.getId(), pageable);
    }

    public void deleteLog(String username, Integer logId) {
        User user = userRepository.findByUsername(username).orElseThrow();
        WasteLog log = wasteLogRepository.findById(logId).orElseThrow();

        if (!log.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not allowed to delete this log.");
        }

        wasteLogRepository.delete(log);
    }
}

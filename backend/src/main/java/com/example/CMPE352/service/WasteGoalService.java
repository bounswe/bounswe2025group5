package com.example.CMPE352.service;
import com.example.CMPE352.repository.UserRepository;
import com.example.CMPE352.exception.AccessDeniedException;
import jakarta.persistence.criteria.CriteriaBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.CMPE352.model.*;
import com.example.CMPE352.repository.WasteGoalRepository;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class WasteGoalService {

    private final WasteGoalRepository wasteGoalRepository;
    private final UserRepository userRepository;



    public Page<WasteGoal> getWasteGoal(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return wasteGoalRepository.findByOwnerId(user.getId(), pageable);
    }

    public WasteGoal saveWasteGoal(String username, WasteGoal wasteGoal) {
        User user = userRepository.findByUsername(username).orElseThrow();
        wasteGoal.setOwner(user);
        return wasteGoalRepository.save(wasteGoal);
    }

    public String updateWasteGoal(String username,Integer goalId, WasteGoal updatedGoal) {
        User user = userRepository.findByUsername(username).orElseThrow();
        WasteGoal goal = wasteGoalRepository.findById(goalId).orElseThrow();

        if (!goal.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to update this goal.");
        }
        goal.setDuration(updatedGoal.getDuration());
        goal.setUnit(updatedGoal.getUnit());

        wasteGoalRepository.save(goal);
        return "Waste goal updated successfully";
    }

    public String deleteWasteGoal(String username, Integer goalId) {
        User user = userRepository.findByUsername(username).orElseThrow();
        WasteGoal goal = wasteGoalRepository.findById(goalId).orElseThrow();

        if (!goal.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to delete this goal.");
        }

        wasteGoalRepository.delete(goal);
        return "Waste goal deleted successfully";
    }
}

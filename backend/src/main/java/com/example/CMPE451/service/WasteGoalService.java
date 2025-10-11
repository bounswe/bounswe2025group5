package com.example.CMPE451.service;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.request.CreateWasteGoalRequest;
import com.example.CMPE451.model.response.CreateWasteGoalResponse;
import com.example.CMPE451.model.response.GetWasteGoalResponse;
import com.example.CMPE451.repository.UserRepository;
import com.example.CMPE451.exception.AccessDeniedException;
import com.example.CMPE451.repository.WasteLogRepository;
import jakarta.persistence.Transient;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.example.CMPE451.model.*;
import com.example.CMPE451.repository.WasteGoalRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class WasteGoalService {

    private final WasteGoalRepository wasteGoalRepository;

    private final UserRepository userRepository;


    public List<GetWasteGoalResponse> getWasteGoals(String username,int size, Long lastGoalId) {
        Page<WasteGoal> goalPage = wasteGoalRepository.findTopGoals(username ,lastGoalId, PageRequest.of(0, size));
        List<WasteGoal> goals = goalPage.getContent();        return goals.stream()
                .map(goal -> {
                    GetWasteGoalResponse goalResponse = new GetWasteGoalResponse();
                    goalResponse.setGoalId(goal.getGoalId());
                    goalResponse.setWasteType(goal.getWasteType().name());
                    goalResponse.setAmount(goal.getAmount());
                    goalResponse.setDuration(goal.getDuration());
                    goalResponse.setUnit(goal.getUnit().name());
                    goalResponse.setProgress(goal.getPercentOfProgress());
                    goalResponse.setCreatedAt(goal.getDate());
                    goalResponse.setCreatorUsername(goal.getOwner().getUsername());
                    return goalResponse;
                })
                .collect(Collectors.toList());
    }


    public CreateWasteGoalResponse saveWasteGoal(CreateWasteGoalRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " +username));

        WasteGoal goal = new WasteGoal(
                user,
                request.getDuration(),
                request.getUnit(),
                request.getWasteType(),
                request.getAmount()
        );
        WasteGoal wasteGoal= wasteGoalRepository.save(goal);
        return new CreateWasteGoalResponse(user.getUsername(),wasteGoal.getGoalId());
    }

    public CreateWasteGoalResponse editWasteGoal(Integer goalId, WasteGoal editGoalRequest) {
        WasteGoal existingGoal = wasteGoalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("Goal not found: " + goalId));

        double oldAmount = existingGoal.getAmount();
        double oldProgress = existingGoal.getPercentOfProgress();
        double newAmount = editGoalRequest.getAmount();

        existingGoal.setDuration(editGoalRequest.getDuration());
        existingGoal.setUnit(editGoalRequest.getUnit());
        existingGoal.setWasteType(editGoalRequest.getWasteType());
        existingGoal.setAmount(newAmount);

        double newProgress = 0.0;
        if (newAmount > 0 && oldAmount > 0) {
            newProgress = oldProgress * (oldAmount / newAmount);
        }

        newProgress = Math.min(newProgress, 100.0);

        existingGoal.setPercentOfProgress(newProgress);
        existingGoal.setCompleted(newProgress >= 100.0 ? 1 : 0);

        wasteGoalRepository.saveAndFlush(existingGoal);

        return new CreateWasteGoalResponse(existingGoal.getOwner().getUsername(), existingGoal.getGoalId());
    }

    public void deleteWasteGoal(Integer goalId) {
        WasteGoal goal = wasteGoalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("Goal not found: " + goalId));

        wasteGoalRepository.delete(goal);
    }
}

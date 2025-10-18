package com.example.CMPE451.service;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.request.CreateOrEditWasteGoalRequest;
import com.example.CMPE451.model.response.CreateWasteGoalResponse;
import com.example.CMPE451.model.response.GetWasteGoalResponse;
import com.example.CMPE451.repository.UserRepository;
import com.example.CMPE451.repository.WasteTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.example.CMPE451.model.*;
import com.example.CMPE451.repository.WasteGoalRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class WasteGoalService {

    private final WasteGoalRepository wasteGoalRepository;
    private final WasteTypeRepository wasteTypeRepository;

    private final UserRepository userRepository;


    public List<GetWasteGoalResponse> getWasteGoals(String username,int size, Long lastGoalId) {
        Page<WasteGoal> goalPage = wasteGoalRepository.findTopGoals(username ,lastGoalId, PageRequest.of(0, size));
        List<WasteGoal> goals = goalPage.getContent();        return goals.stream()
                .map(goal -> {
                    GetWasteGoalResponse goalResponse = new GetWasteGoalResponse();
                    goalResponse.setGoalId(goal.getGoalId());
                    goalResponse.setWasteType(goal.getType().getName());
                    goalResponse.setRestrictionAmountGrams(goal.getRestrictionAmountGrams());
                    goalResponse.setDuration(goal.getDuration());
                    goalResponse.setProgress(goal.getPercentOfProgress());
                    goalResponse.setCreatedAt(goal.getDate());
                    goalResponse.setCreatorUsername(goal.getOwner().getUsername());
                    return goalResponse;
                })
                .collect(Collectors.toList());
    }


    public CreateWasteGoalResponse saveWasteGoal(CreateOrEditWasteGoalRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found: " +username));
        WasteType wasteType = wasteTypeRepository.findByName(request.getType())
                .orElseThrow(() -> new NotFoundException("WasteType not found: " + request.getType()));

        WasteGoal goal = new WasteGoal(
                user,
                request.getDuration(),
                wasteType,
                request.getRestrictionAmountGrams()
        );
        WasteGoal wasteGoal= wasteGoalRepository.save(goal);
        return new CreateWasteGoalResponse(user.getUsername(),wasteGoal.getGoalId());
    }

    public CreateWasteGoalResponse editWasteGoal(Integer goalId, CreateOrEditWasteGoalRequest request) {
        WasteGoal existingGoal = wasteGoalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("Goal not found: " + goalId));
        WasteType wasteType = wasteTypeRepository.findByName(request.getType())
                .orElseThrow(() -> new NotFoundException("WasteType not found: " + request.getType()));

        double oldAmount = existingGoal.getRestrictionAmountGrams();
        double oldProgress = existingGoal.getPercentOfProgress();
        double newAmount = request.getRestrictionAmountGrams();

        existingGoal.setDuration(request.getDuration());
        existingGoal.setType(wasteType);
        existingGoal.setRestrictionAmountGrams(request.getRestrictionAmountGrams());

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

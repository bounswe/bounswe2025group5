package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.CreateWasteGoalRequest;
import com.example.CMPE451.model.response.CreateWasteGoalResponse;
import com.example.CMPE451.model.response.DeleteWasteGoalResponse;
import com.example.CMPE451.model.response.GetWasteGoalResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import com.example.CMPE451.model.*;
import com.example.CMPE451.service.WasteGoalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/goals")
public class WasteGoalController {

    private final WasteGoalService wasteGoalService;

    public WasteGoalController(WasteGoalService wasteGoalService) {
        this.wasteGoalService = wasteGoalService;
    }

    @GetMapping("/info")
    public ResponseEntity<List<GetWasteGoalResponse>> getGoals(
            @RequestParam String username,
            @RequestParam int size,
            @RequestParam(required = false) Long lastGoalId
    ) {
        List<GetWasteGoalResponse> goals = wasteGoalService.getWasteGoals(username,size, lastGoalId);
        return ResponseEntity.ok(goals);
    }

    @PostMapping("/create")
    public ResponseEntity<CreateWasteGoalResponse> createWasteGoal(@RequestBody CreateWasteGoalRequest createWasteGoalRequest) {
        CreateWasteGoalResponse goal = wasteGoalService.saveWasteGoal(createWasteGoalRequest);
        return ResponseEntity.ok(goal);

    }

    @PutMapping("/edit/{goalId}")
    public ResponseEntity<CreateWasteGoalResponse> editWasteGoal(
            @PathVariable Integer goalId,
            @RequestBody WasteGoal updatedGoal) {
        CreateWasteGoalResponse updatedGoalResponse = wasteGoalService.editWasteGoal(goalId, updatedGoal);
        return ResponseEntity.ok(updatedGoalResponse);
    }


    @DeleteMapping("/delete/{goalId}")
    public ResponseEntity<DeleteWasteGoalResponse> deleteWasteGoal(@PathVariable Integer goalId) {
        wasteGoalService.deleteWasteGoal(goalId);
        return ResponseEntity.ok(new DeleteWasteGoalResponse(goalId));
    }
}

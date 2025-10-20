package com.example.CMPE451.controller;

import com.example.CMPE451.model.WasteItem;
import com.example.CMPE451.model.request.CreateOrEditWasteGoalRequest;
import com.example.CMPE451.model.response.CreateWasteGoalResponse;
import com.example.CMPE451.model.response.DeleteWasteGoalResponse;
import com.example.CMPE451.model.response.GetWasteGoalResponse;
import com.example.CMPE451.service.WasteGoalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/users")
public class WasteGoalController {

    private final WasteGoalService wasteGoalService;

    public WasteGoalController(WasteGoalService wasteGoalService) {
        this.wasteGoalService = wasteGoalService;
    }

    @GetMapping("/{username}/waste-goals")
    public ResponseEntity<List<GetWasteGoalResponse>> getGoals(
            @PathVariable String username,
            @RequestParam int size,
            @RequestParam(required = false) Long lastGoalId
    ) {
        List<GetWasteGoalResponse> goals = wasteGoalService.getWasteGoals(username,size, lastGoalId);
        return ResponseEntity.ok(goals);
    }



    @PostMapping("/{username}/waste-goals")
    public ResponseEntity<CreateWasteGoalResponse> createWasteGoal(@RequestBody CreateOrEditWasteGoalRequest createWasteGoalRequest, @PathVariable String username) {
        CreateWasteGoalResponse goal = wasteGoalService.saveWasteGoal(createWasteGoalRequest,username);
        return ResponseEntity.ok(goal);

    }

    @PutMapping("/waste-goals/{goalId}")
    public ResponseEntity<CreateWasteGoalResponse> editWasteGoal(
            @PathVariable Integer goalId,
            @RequestBody CreateOrEditWasteGoalRequest updatedGoal) {
        CreateWasteGoalResponse updatedGoalResponse = wasteGoalService.editWasteGoal(goalId, updatedGoal);
        return ResponseEntity.ok(updatedGoalResponse);
    }


    @DeleteMapping("/waste-goals/{goalId}")
    public ResponseEntity<DeleteWasteGoalResponse> deleteWasteGoal(@PathVariable Integer goalId) {
        wasteGoalService.deleteWasteGoal(goalId);
        return ResponseEntity.ok(new DeleteWasteGoalResponse(goalId));
    }

    @GetMapping("/waste-goals/{goalId}/items")
    public ResponseEntity<List<WasteItem>> getWasteItemsForGoal(@PathVariable Integer goalId) {
        List<WasteItem> items = wasteGoalService.getWasteItemsForGoalType(goalId);
        return ResponseEntity.ok(items);
    }
}

package com.example.CMPE352.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import com.example.CMPE352.model.*;
import com.example.CMPE352.service.WasteGoalService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/users")
public class WasteGoalController {

    private final WasteGoalService wasteGoalService;

    public WasteGoalController(WasteGoalService wasteGoalService) {
        this.wasteGoalService = wasteGoalService;
    }

    @GetMapping("/{username}/goals")
    public Page<WasteGoal> getGoalsInDatabase(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return wasteGoalService.getWasteGoal(username, pageable);
    }

    @PostMapping("/{username}/goals")
    public WasteGoal createWasteGoal(@PathVariable String username, @RequestBody WasteGoal goal) {
        return wasteGoalService.saveWasteGoal(username, goal);
    }

    @PutMapping("/{username}/goals/{goalId}")
    public String updateWasteGoal(@PathVariable String username,
                                @PathVariable Integer goalId,
                                @RequestBody WasteGoal updatedGoal) {

        return wasteGoalService.updateWasteGoal(username, goalId, updatedGoal);

    }

    @DeleteMapping("/{username}/goals/{goalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public String deleteWasteGoal(@PathVariable String username, @PathVariable Integer goalId) {
        return wasteGoalService.deleteWasteGoal(username, goalId);
    }
}

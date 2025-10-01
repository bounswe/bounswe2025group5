package com.example.CMPE451.controller;

import com.example.CMPE451.model.WasteGoal;
import com.example.CMPE451.model.request.CreateWasteLogRequest;
import com.example.CMPE451.model.request.UpdateWasteLogRequest;
import com.example.CMPE451.model.response.CreateOrEditWasteLogResponse;
import com.example.CMPE451.model.response.DeleteWasteLogResponse;
import com.example.CMPE451.model.response.GetWasteLogResponse;
import com.example.CMPE451.model.response.TotalLogResponse;
import com.example.CMPE451.service.WasteLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class WasteLogController {

    private final WasteLogService wasteLogService;

    @GetMapping("/get")
    public ResponseEntity<List<GetWasteLogResponse>> getLogs(
            @RequestParam Integer goalId) {
        List<GetWasteLogResponse> logs = wasteLogService.getWasteLogsForGoal(goalId);
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/create")
    public ResponseEntity<CreateOrEditWasteLogResponse> createWasteLog(@RequestBody CreateWasteLogRequest request) {
        CreateOrEditWasteLogResponse response = wasteLogService.createWasteLog(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/update/{logId}")
    public ResponseEntity<CreateOrEditWasteLogResponse> updateWasteLog(
            @PathVariable Integer logId,
            @RequestBody UpdateWasteLogRequest  updateWasteLogRequest) {
        CreateOrEditWasteLogResponse response = wasteLogService.updateWasteLog(logId,updateWasteLogRequest);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete/{logId}")
    public ResponseEntity<DeleteWasteLogResponse> deleteWasteLog(@PathVariable Integer logId) {
        DeleteWasteLogResponse  response = wasteLogService.deleteWasteLog(logId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/totalLogAmountForIntervalAndType")
    public ResponseEntity<TotalLogResponse> totalLogAmountForInterval(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam("wasteType") WasteGoal.wasteType wasteType
    ) {
        return ResponseEntity.ok(wasteLogService.getTotalWasteAmountByTypeAndInterval(wasteType, startDate, endDate));
    }
}
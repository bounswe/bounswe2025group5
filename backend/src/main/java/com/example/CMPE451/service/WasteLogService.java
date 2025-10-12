package com.example.CMPE451.service;

import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.*;
import com.example.CMPE451.model.request.CreateWasteLogRequest;
import com.example.CMPE451.model.request.UpdateWasteLogRequest;
import com.example.CMPE451.model.response.CreateOrEditWasteLogResponse;
import com.example.CMPE451.model.response.DeleteWasteLogResponse;
import com.example.CMPE451.model.response.GetWasteLogResponse;
import com.example.CMPE451.model.response.TotalLogResponse;
import com.example.CMPE451.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WasteLogService {
    private final UserRepository userRepository;
    private final WasteItemRepository wasteItemRepository;
    private final WasteTypeRepository wasteTypeRepository;

    private final WasteLogRepository wasteLogRepository;
    private final WasteGoalRepository wasteGoalRepository;

    public List<GetWasteLogResponse> getWasteLogsForGoal(Integer goalId) {
        WasteGoal goal = wasteGoalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("WasteGoal not found: " + goalId));

        List<WasteLog> wasteLogs = wasteLogRepository.findByGoal(goal);
        return wasteLogs.stream()
                .map(wasteLog -> {
                    GetWasteLogResponse response = new GetWasteLogResponse();
                    response.setLogId(wasteLog.getLogId());
                    response.setDate(wasteLog.getDate());
                    response.setGoalId(wasteLog.getGoal().getGoalId());
                    response.setUsername(wasteLog.getUser().getUsername());
                    response.setWasteItem(wasteLog.getItem());
                    return response;
                })
                .collect(Collectors.toList());
    }
    @Transactional
    public CreateOrEditWasteLogResponse createWasteLog(CreateWasteLogRequest request, Integer goalId) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("User not found: " + request.getUsername()));

        WasteGoal goal = wasteGoalRepository.findById(goalId)
                .orElseThrow(() -> new NotFoundException("WasteGoal not found: " + goalId));

        WasteItem item = wasteItemRepository.findById(request.getItemId())
                .orElseThrow(() -> new NotFoundException("WasteItem not found: " + request.getItemId()));

        WasteLog wasteLog = new WasteLog(user, goal, item, request.getQuantity());


        wasteLogRepository.save(wasteLog);

        return new CreateOrEditWasteLogResponse(
                wasteLog.getLogId(),
                wasteLog.getItem().getDisplayName(),
                wasteLog.getQuantity(),
                wasteLog.getDate()
        );
    }
    @Transactional
    public CreateOrEditWasteLogResponse updateWasteLog(Integer logId, UpdateWasteLogRequest request) {
        WasteLog existingLog = wasteLogRepository.findById(logId)
                .orElseThrow(() -> new NotFoundException("WasteLog not found: " + logId));
        existingLog.setQuantity(request.getQuantity());
        wasteLogRepository.save(existingLog);

        return new CreateOrEditWasteLogResponse(existingLog.getLogId(), existingLog.getItem().getDisplayName(), existingLog.getQuantity(), existingLog.getDate());
    }
   @Transactional
    public DeleteWasteLogResponse deleteWasteLog(Integer logId) {
        WasteLog wasteLog = wasteLogRepository.findById(logId)
                .orElseThrow(() -> new NotFoundException("WasteLog not found: " + logId));
        wasteLogRepository.delete(wasteLog);
        return new DeleteWasteLogResponse(logId);
    }

    public TotalLogResponse getTotalWasteAmountByTypeAndInterval(String wasteTypeName, LocalDateTime startDate, LocalDateTime endDate) {
        WasteType wasteType = wasteTypeRepository.findByName(wasteTypeName)
                .orElseThrow(() -> new NotFoundException("WasteType not found: " + wasteTypeName));
        Double totalAmount = wasteLogRepository.findTotalAmountByDateRange(wasteTypeName, startDate, endDate);
        return new TotalLogResponse(wasteType, totalAmount);
    }
}
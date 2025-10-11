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
                    response.setAmount(wasteLog.getAmount());
                    response.setDate(wasteLog.getDate());
                    response.setGoalId(wasteLog.getGoal().getGoalId());
                    response.setUsername(wasteLog.getUser().getUsername());
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

        WasteLog wasteLog = new WasteLog();
        wasteLog.setAmount(request.getAmount());
        wasteLog.setUser(user);
        wasteLog.setGoal(goal);
        wasteLog.setWasteType(goal.getWasteType());

        wasteLogRepository.save(wasteLog);

        return new CreateOrEditWasteLogResponse(wasteLog.getLogId(), wasteLog.getAmount(), wasteLog.getDate());
    }
    @Transactional
    public CreateOrEditWasteLogResponse updateWasteLog(Integer logId, UpdateWasteLogRequest request) {
        WasteLog existingLog = wasteLogRepository.findById(logId)
                .orElseThrow(() -> new NotFoundException("WasteLog not found: " + logId));
        existingLog.setAmount(request.getAmount());
        wasteLogRepository.save(existingLog);

        return new CreateOrEditWasteLogResponse(existingLog.getLogId(), existingLog.getAmount(), existingLog.getDate());
    }
   @Transactional
    public DeleteWasteLogResponse deleteWasteLog(Integer logId) {
        WasteLog wasteLog = wasteLogRepository.findById(logId)
                .orElseThrow(() -> new NotFoundException("WasteLog not found: " + logId));
        wasteLogRepository.delete(wasteLog);
        return new DeleteWasteLogResponse(logId);
    }

    public TotalLogResponse getTotalWasteAmountByTypeAndInterval(WasteGoal.wasteType wasteType, LocalDateTime startDate, LocalDateTime endDate) {
        Double totalAmount = wasteLogRepository.findTotalAmountByDateRange(wasteType, startDate, endDate);
        return new TotalLogResponse(wasteType,totalAmount);
    }
}
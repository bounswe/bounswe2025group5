package com.example.CMPE352.controller;

import com.example.CMPE352.model.WasteLog;
import com.example.CMPE352.service.WasteLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class WasteLogController {

    private final WasteLogService wasteLogService;

    public WasteLogController(WasteLogService wasteLogService) {
        this.wasteLogService = wasteLogService;
    }

    // Save new log
    @PostMapping("/{username}/logs")
    public WasteLog addLog(@PathVariable String username, @RequestBody WasteLog log) {
        return wasteLogService.saveLog(username, log);
    }

    // Get log
    @GetMapping("/{username}/logs")
    public Page<WasteLog> getLogs(@PathVariable String username,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return wasteLogService.getUserLogs(username, pageable);
    }

    // Delete log
    @DeleteMapping("/{username}/logs/{logId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLog(@PathVariable String username, @PathVariable Integer logId) {
        wasteLogService.deleteLog(username, logId);
    }
}


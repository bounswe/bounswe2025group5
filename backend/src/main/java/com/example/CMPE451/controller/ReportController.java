package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.CreateReportRequest;
import com.example.CMPE451.model.response.ReportResponse;
import com.example.CMPE451.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;


    @PostMapping("/create")
    public ResponseEntity<ReportResponse> createReport(@RequestBody CreateReportRequest request) {
            ReportResponse response = reportService.createReport(request);
            return ResponseEntity.ok(response);

    }


    @GetMapping("/unread")
    public ResponseEntity<List<ReportResponse>> getUnreadReports() {
        List<ReportResponse> response = reportService.getUnreadReports();
        return ResponseEntity.ok(response);
    }


    @PutMapping("/{id}/read")
    public ResponseEntity<ReportResponse> readReport(@PathVariable Integer id) {
            ReportResponse response = reportService.markReportAsRead(id);
            return ResponseEntity.ok(response);

    }
}
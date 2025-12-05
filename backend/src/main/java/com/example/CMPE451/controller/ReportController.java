package com.example.CMPE451.controller;

import com.example.CMPE451.model.request.CreateReportRequest;
import com.example.CMPE451.model.response.CreateReportResponse;
import com.example.CMPE451.model.response.GetReportResponse;
import com.example.CMPE451.model.response.MarkResponse;
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


    @PostMapping
    public ResponseEntity<CreateReportResponse> createReport(@RequestBody CreateReportRequest request) {
        CreateReportResponse response = reportService.createReport(request);
            return ResponseEntity.ok(response);

    }

    @GetMapping("/unread")
    public ResponseEntity<List<GetReportResponse>> getUnSolvedReports() {
        List<GetReportResponse> response = reportService.getUnreadReports();
        return ResponseEntity.ok(response);
    }


    @PutMapping("/{id}/solve-flag")
    public ResponseEntity<MarkResponse> solveReport(@PathVariable Integer id) {
            MarkResponse response = reportService.markReportAsSolved(id);
            return ResponseEntity.ok(response);

    }
    @PutMapping("/{id}/delete-flag")
    public ResponseEntity<MarkResponse> markAsDeletion(@PathVariable Integer id) {
        MarkResponse response = reportService.markReportAsDeleted(id);
        return ResponseEntity.ok(response);
    }
}
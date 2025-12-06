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

    @GetMapping("/{username}/unread")
    public ResponseEntity<List<GetReportResponse>> getUnSolvedReports(@PathVariable String username) {
        List<GetReportResponse> response = reportService.getUnreadReports(username);
        return ResponseEntity.ok(response);
    }


    @PutMapping("/{username}/{id}/solve-flag")
    public ResponseEntity<MarkResponse> solveReport(@PathVariable Integer id,@PathVariable String username) {
            MarkResponse response = reportService.markReportAsSolved(id,username);
            return ResponseEntity.ok(response);

    }
    @PutMapping("/{username}/{id}/delete-flag")
    public ResponseEntity<MarkResponse> markAsDeletion(@PathVariable Integer id,@PathVariable String username) {
        MarkResponse response = reportService.markReportAsDeleted(id,username);
        return ResponseEntity.ok(response);
    }
}
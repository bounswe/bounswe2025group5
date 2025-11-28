package com.example.CMPE451.service;

import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.Report;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.request.CreateReportRequest;
import com.example.CMPE451.model.response.ReportResponse;
import com.example.CMPE451.repository.ReportRepository;
import com.example.CMPE451.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ReportResponse createReport(CreateReportRequest request) {
        User reporter = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Reporter user not found"));

        Report report = new Report();
        report.setReporter(reporter);
        report.setDescription(request.getContent());
        report.setType(request.getType());
        report.setIsRead(false);

        Report savedReport = reportRepository.save(report);
        return mapToResponse(savedReport);
    }

    public List<ReportResponse> getUnreadReports() {
        List<Report> reports = reportRepository.findByIsReadFalse();
        return reports.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ReportResponse markReportAsRead(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found with id :"+ reportId.toString()));
        report.setIsRead(true);
        Report savedReport = reportRepository.save(report);
        return mapToResponse(savedReport);
    }

    private ReportResponse mapToResponse(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReporter().getUsername(),
                report.getType(),
                report.getDescription(),
                report.getIsRead(),
                report.getCreatedAt()
        );
    }
}
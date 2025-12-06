package com.example.CMPE451.service;

import com.example.CMPE451.exception.InvalidCredentialsException;
import com.example.CMPE451.exception.NotFoundException;
import com.example.CMPE451.model.Report;
import com.example.CMPE451.model.User;
import com.example.CMPE451.model.request.CreateReportRequest;
import com.example.CMPE451.model.response.CreateReportResponse;
import com.example.CMPE451.model.response.GetReportResponse;
import com.example.CMPE451.model.response.MarkResponse;
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

    private void checkModeratorAccess(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User with username: " + username + " not found"));
        if (!user.getIsModerator()) {
            throw new InvalidCredentialsException("User " + username + " is not authorized to perform this action.");
        }
    }
    public CreateReportResponse createReport(CreateReportRequest request) {
        User reporter = userRepository.findByUsername(request.getReporterName())
                .orElseThrow(() -> new NotFoundException("Reporter user with the name : "+request.getReporterName() + " not found"));
        Report report = new Report();
        report.setReporter(reporter);
        report.setDescription(request.getDescription());
        report.setType(request.getType());
        report.setIsSolved(0);
        report.setContentType(request.getContentType());
        report.setObjectId(request.getObjectId());
        reportRepository.save(report);
        return new CreateReportResponse(true);
    }

    public List<GetReportResponse> getUnreadReports(String username) {
        checkModeratorAccess(username);
        List<Report> reports = reportRepository.findByIsSolved(0);
        return reports.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    public MarkResponse markReportAsDeleted(Integer reportId,String username) {
        checkModeratorAccess(username);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found with id :"+ reportId));
        report.setAction("Deletion");
        reportRepository.save(report);
        return new MarkResponse(true,reportId);
    }

    public MarkResponse markReportAsSolved(Integer reportId,String username) {
        checkModeratorAccess(username);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found with id :"+ reportId));
        report.setIsSolved(1);
        if (report.getAction() == null || !report.getAction().equals("Deletion")){
            report.setAction("ClosedWithoutChange");
        }
        reportRepository.save(report);
        return new MarkResponse(true,reportId);
    }

    private GetReportResponse mapToResponse(Report report) {
        return new GetReportResponse(
                report.getId(),
                report.getReporter().getUsername(),
                report.getType(),
                report.getDescription(),
                report.getIsSolved(),
                report.getContentType(),
                report.getObjectId(),
                report.getCreatedAt()
        );
    }
}
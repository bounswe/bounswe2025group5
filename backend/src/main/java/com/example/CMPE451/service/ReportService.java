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

    public CreateReportResponse createReport(CreateReportRequest request) {
        User reporter = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("Reporter user with the name : "+request.getUsername() + " not found"));
        if (!(List.of("Violence", "Sexuality", "Other","Spam","Hate Speech").contains(request.getType()))){
            throw  new InvalidCredentialsException("The given type: "+ request.getType()+" not appropriate");
        }
        Report report = new Report();
        report.setReporter(reporter);
        report.setDescription(request.getContent());
        report.setType(request.getType());
        report.setIsSolved(0);
        report.setContentType(request.getContentType());
        report.setObjectId(request.getObjectId());
        reportRepository.save(report);
        return new CreateReportResponse(true);
    }

    public List<GetReportResponse> getUnreadReports() {
        List<Report> reports = reportRepository.findByIsSolved(0);
        return reports.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    public MarkResponse markReportAsDeleted(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found with id :"+ reportId));
        report.setAction("Deletion");
        reportRepository.save(report);
        return new MarkResponse(true,reportId);
    }

    public MarkResponse markReportAsSolved(Integer reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found with id :"+ reportId));
        report.setIsSolved(1);
        if (!report.getAction().equals("Deletion")){
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
                report.getCreatedAt()
        );
    }
}
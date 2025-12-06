package com.example.CMPE451.repository;

import com.example.CMPE451.model.Report;
import com.example.CMPE451.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    List<Report> findByReporter(User reporter);

    List<Report> findByType(String type);

    List<Report> findByIsSolved(Integer status);
}
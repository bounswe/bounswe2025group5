package com.example.CMPE352.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "Report")
@Data
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id", unique = true, nullable = false)
    private Integer id;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "report_date", nullable = false)
    private Timestamp reportDate;

    public enum Status {RECEIVED, RESOLVED}

    @Column(name = "status")
    private Status status;
}
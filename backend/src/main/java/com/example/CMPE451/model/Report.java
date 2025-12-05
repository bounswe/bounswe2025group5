package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "report")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = {"reporter"})
@EqualsAndHashCode(exclude = {"reporter"})
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter", referencedColumnName = "username", nullable = false)
    private User reporter;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "isSolved", nullable = false)
    private Integer isSolved = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "object_id", nullable = false)
    private Integer objectId;

    @Column(name = "action")
    private String action;
}
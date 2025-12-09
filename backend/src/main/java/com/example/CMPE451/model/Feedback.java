package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "feedback")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = {"feedbacker"})
@EqualsAndHashCode(exclude = {"feedbacker"})
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedbacker_username", referencedColumnName = "username", nullable = false)
    private User feedbacker;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "is_seen", nullable = false)
    private Integer isSeen = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;
}
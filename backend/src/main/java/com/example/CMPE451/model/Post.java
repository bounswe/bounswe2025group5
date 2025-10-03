package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "Posts")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Integer postId;


    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "content", nullable = false, length = 1000)
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @Column(name = "likes", nullable = false)
    private Integer likes;

    @Column(name = "comments", nullable = false)
    private Integer comments;



    @Column(name = "photo_url")
    private String photoUrl;


    public Post(User user, String content, String photoUrl, Integer likes, Integer comments) {
        this.user = user;
        this.content = content;
        this.photoUrl = photoUrl;
        this.likes = likes;
        this.comments = comments;

    }
}

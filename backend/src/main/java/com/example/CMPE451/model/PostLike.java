package com.example.CMPE451.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.sql.Timestamp;

@Entity
@Table(name = "post_likes")
@IdClass(PostLike.PostLikeId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostLike {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Id
    @Column(name = "post_id")
    private Integer postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", insertable = false, updatable = false)
    private Post post;

    @CreationTimestamp
    @Column(name = "liked_at", updatable = false)
    private Timestamp likedAt;

    // Convenience constructor for adding PostLike
    public PostLike(Integer userId, Integer postId) {
        this.userId = userId;
        this.postId = postId;
    }

    // Composite Key class
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostLikeId implements Serializable {
        private Integer userId;
        private Integer postId;
    }
}

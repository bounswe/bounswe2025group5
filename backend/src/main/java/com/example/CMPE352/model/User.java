package com.example.CMPE352.model;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;
import java.util.List;

@Entity
@Table(name = "Users")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = {"profile", "notifications", "userRewards", "goals", "logs"})
@EqualsAndHashCode(exclude = {"profile", "notifications", "userRewards", "goals", "logs"})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "total_xp", nullable = false)
    private Integer totalXp = 0;

    @Column(name = "is_moderator", nullable = false)
    private Boolean isModerator = false;

    @Column(name = "is_admin", nullable = false)
    private Boolean isAdmin = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Profile profile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Notification> notifications;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserReward> userRewards;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    private List<WasteGoal> goals;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<WasteLog> logs;

    public User(String email, String username, String passwordHash) {
        this.email = email;
        this.username = username;
        this.passwordHash = passwordHash;
    }

}
























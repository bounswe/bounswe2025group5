package com.example.CMPE451.repository;



import com.example.CMPE451.model.Badge;
import com.example.CMPE451.model.BadgeId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, BadgeId> {
    List<Badge> findByUserId(Integer userId);
}

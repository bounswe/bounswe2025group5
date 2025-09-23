package com.example.CMPE352.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.CMPE352.model.WasteGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WasteGoalRepository extends JpaRepository<WasteGoal, Integer> {
    @Query("""

            SELECT g FROM WasteGoal g
    WHERE g.owner.username = :username
      AND (:lastGoalId IS NULL OR g.goalId < :lastGoalId)
    ORDER BY g.goalId DESC
    """)
    Page<WasteGoal> findTopGoals(@Param("username") String username,
                                 @Param("lastGoalId") Long lastGoalId,
                                 Pageable pageable);
}

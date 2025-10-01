package com.example.CMPE451.repository;

import com.example.CMPE451.model.WasteGoal;
import com.example.CMPE451.model.WasteLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface WasteLogRepository extends JpaRepository<WasteLog, Integer> {
    Page<WasteLog> findByUserId(Integer userId, Pageable pageable);

    List<WasteLog> findByGoal(WasteGoal goal);

    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM WasteLog w " +
            "WHERE w.goal.wasteType = :wasteType " +
            "AND w.date BETWEEN :startDate AND :endDate")
    Double findTotalAmountByDateRange(WasteGoal.wasteType wasteType ,LocalDateTime startDate, LocalDateTime endDate);
}


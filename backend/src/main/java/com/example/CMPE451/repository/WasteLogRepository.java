package com.example.CMPE451.repository;

import com.example.CMPE451.model.WasteGoal;
import com.example.CMPE451.model.WasteLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface WasteLogRepository extends JpaRepository<WasteLog, Integer> {
    Page<WasteLog> findByUserId(Integer userId, Pageable pageable);

    List<WasteLog> findByGoal(WasteGoal goal);

    @Query("SELECT COALESCE(SUM(w.quantity * w.item.weightInGrams), 0.0) " +
            "FROM WasteLog w " +
            "WHERE w.item.type.name = :wasteTypeName " +
            "AND w.date BETWEEN :startDate AND :endDate")
    Double findTotalAmountByDateRange(@Param("wasteTypeName") String wasteTypeName,
                                      @Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate);
}



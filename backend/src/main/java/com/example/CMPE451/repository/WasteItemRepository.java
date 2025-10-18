package com.example.CMPE451.repository;


import com.example.CMPE451.model.WasteItem;
import com.example.CMPE451.model.WasteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface WasteItemRepository extends JpaRepository<WasteItem, Integer> {
    List<WasteItem> findByType(WasteType type);
    Optional<WasteItem> findByDisplayName(String displayName);
}
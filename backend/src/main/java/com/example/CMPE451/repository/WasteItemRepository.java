package com.example.CMPE451.repository;


import com.example.CMPE451.model.WasteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for the WasteItem entity.
 */
@Repository
public interface WasteItemRepository extends JpaRepository<WasteItem, Integer> {


    Optional<WasteItem> findByDisplayName(String displayName);

}
package com.example.CMPE451.repository;

import com.example.CMPE451.model.WasteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WasteTypeRepository extends JpaRepository<WasteType, Integer> {

    Optional<WasteType> findByName(String name);

}
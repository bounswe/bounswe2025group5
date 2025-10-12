package com.example.CMPE451.model.response;

import com.example.CMPE451.model.WasteItem;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class GetWasteLogResponse {
    private Integer logId;
    private LocalDateTime date;
    private Integer goalId;
    private String username;
    private WasteItem wasteItem;

}

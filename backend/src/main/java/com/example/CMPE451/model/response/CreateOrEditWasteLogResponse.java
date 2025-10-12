package com.example.CMPE451.model.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrEditWasteLogResponse {

    private Integer logId;
    private String displayName;
    private Integer quantity;
    private LocalDateTime date;


}

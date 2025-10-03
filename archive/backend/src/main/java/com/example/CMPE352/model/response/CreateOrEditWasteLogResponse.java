package com.example.CMPE352.model.response;

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
    private Double amount;
    private LocalDateTime date;

}

package com.example.CMPE352.model.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateWasteLogRequest {

    private Double amount;
    private Integer goalId;
    private String username;

}

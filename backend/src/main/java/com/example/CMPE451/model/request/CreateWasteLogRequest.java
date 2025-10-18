package com.example.CMPE451.model.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateWasteLogRequest {
    private String username;
    private Integer itemId;
    private int quantity;
}

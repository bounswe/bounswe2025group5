package com.example.CMPE352.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SavePostResponse {
    private Integer userId;
    private Integer postId;
}

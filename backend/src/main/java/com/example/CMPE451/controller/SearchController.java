package com.example.CMPE451.controller;


import com.example.CMPE451.exception.InvalidCredentialsException;

import com.example.CMPE451.model.response.GetPostResponse;
import com.example.CMPE451.service.ForumSearchService;
import com.example.CMPE451.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/forum/search")
@RequiredArgsConstructor
public class SearchController {
    private final ForumSearchService forumSearchService;
    private final PostService postService;

    @GetMapping("/semantic")
    public ResponseEntity<List<GetPostResponse>> searchPostsSemantic(
            @RequestParam(name = "query") String query,
            @RequestParam(required = false) String username,
            @RequestParam(name = "lang", defaultValue = "en") String language) {
        return ResponseEntity.ok(postService.semanticSearch(query, username));
    }
}

package com.example.CMPE352.controller;


import com.example.CMPE352.exception.InvalidCredentialsException;

import com.example.CMPE352.model.response.GetPostResponse;
import com.example.CMPE352.service.ForumSearchService;
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
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {
    private final ForumSearchService forumSearchService;

    @GetMapping("/posts/semantic")
    public ResponseEntity<List<GetPostResponse>> searchPostsSemanticEndpoint(
            @RequestParam(name = "query") String query,
            @RequestParam(name = "lang", defaultValue = "en") String language) {

        try {
            List<GetPostResponse> results = forumSearchService.searchPostsSemantic(query, language);
            return ResponseEntity.ok(results);

        } catch (InvalidCredentialsException e) {
            return ResponseEntity.badRequest().body(Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }
}
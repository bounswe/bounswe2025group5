package com.example.CMPE352.service;


import com.example.CMPE352.exception.InvalidCredentialsException;
import com.example.CMPE352.model.Post;
import com.example.CMPE352.model.response.GetPostResponse;
import com.example.CMPE352.model.wikidata.SparqlBindingValue;
import com.example.CMPE352.model.wikidata.SparqlResponse;
import com.example.CMPE352.model.wikidata.WikidataSearchResult;
import com.example.CMPE352.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ForumSearchService {

    private final WikidataLookUpService wikidataLookUpService;
    private final PostRepository postRepository;

    private static final String SPARQL_QUERY_TEMPLATE = """
            SELECT DISTINCT ?relatedEntity ?relatedLabel WHERE {
              VALUES ?appContextEntity {
                  wd:Q45701
                  wd:Q180388
                  wd:Q131201
              }
            
              BIND(wd:%s AS ?userInputEntity)
              {
                BIND(?userInputEntity AS ?relatedEntity)
              }
              UNION
              {
                BIND(?appContextEntity AS ?relatedEntity)
              }
              UNION { ?userInputEntity wdt:P279 ?relatedEntity . FILTER(?relatedEntity != ?userInputEntity) }
              UNION { ?userInputEntity wdt:P361 ?relatedEntity . FILTER(?relatedEntity != ?userInputEntity) }
              UNION { ?userInputEntity wdt:P1269 ?relatedEntity . FILTER(?relatedEntity != ?userInputEntity) }
            
              UNION { ?relatedEntity wdt:P279* ?userInputEntity . FILTER(?relatedEntity != ?userInputEntity) }
              UNION { ?relatedEntity wdt:P31 ?userInputEntity . FILTER(?relatedEntity != ?userInputEntity) }
              UNION { ?relatedEntity wdt:P527 ?userInputEntity . FILTER(?relatedEntity != ?userInputEntity) }
              UNION { ?relatedEntity wdt:P279* wd:Q180374 . }
              UNION { ?relatedEntity wdt:P31 wd:Q180374 . }
              UNION { ?relatedEntity wdt:P279* wd:Q45701 . }
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "%s,und".
                ?relatedEntity rdfs:label ?relatedLabel .
              }
            }
            LIMIT 150
            """;

    public List<GetPostResponse> searchPostsSemantic(String query, String language) {
        String trimmedQuery = query.trim();
        if (trimmedQuery.isEmpty()) {
            throw new InvalidCredentialsException("Null Query");
        }
        Set<String> keywords = new HashSet<>();
        keywords.add(trimmedQuery.toLowerCase());
        Optional<WikidataSearchResult> coreEntityOpt = Optional.empty();
        try {
            coreEntityOpt = wikidataLookUpService
                    .findTopEntity(trimmedQuery, language)
                    .blockOptional(Duration.ofSeconds(20));
        } catch (Exception e) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        if (coreEntityOpt.isPresent()) {
            WikidataSearchResult coreEntity = coreEntityOpt.get();
            String coreEntityQid = coreEntity.getId();
            String coreEntityLabel = coreEntity.getLabel();

            if (coreEntityLabel != null && !coreEntityLabel.isBlank()) {
                keywords.add(coreEntityLabel.toLowerCase());
            }

            String sparqlQuery = String.format(SPARQL_QUERY_TEMPLATE, coreEntityQid, language);
            Optional<SparqlResponse> sparqlResponseOpt = Optional.empty();

            try {
                sparqlResponseOpt = wikidataLookUpService.executeSparqlQuery(sparqlQuery)
                        .blockOptional(Duration.ofSeconds(50));
            } catch (Exception e) {
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
            if (sparqlResponseOpt.isPresent()) {
                Set<String> relatedLabels = extractLabelsFromSparqlResponse(sparqlResponseOpt.get());
                keywords.addAll(relatedLabels);
            }
        }
        return searchPostsByKeywordSet(keywords);
    }

    private Set<String> extractLabelsFromSparqlResponse(SparqlResponse sparqlResponse) {
        Set<String> labels = new HashSet<>();
        if (sparqlResponse != null && sparqlResponse.getResults() != null && sparqlResponse.getResults().getBindings() != null) {
            labels = sparqlResponse.getResults().getBindings().stream()
                    .map(bindingMap -> {
                        SparqlBindingValue labelBinding = bindingMap.getRelatedLabel();
                        return (labelBinding != null) ? labelBinding.getValue() : null;
                    })
                    .filter(label -> label != null && !label.isBlank())
                    .filter(label -> !label.matches("Q\\d+"))
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());
        }
        return labels;
    }

    private List<GetPostResponse> searchPostsByKeywordSet(Set<String> keywords) {
        if (keywords == null || keywords.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Post> resultSet = new HashSet<>();
        for (String term : keywords) {
            if (term.length() < 2) continue;
            List<Post> postsFound = postRepository.findByContentContainingIgnoreCase(term);
            if (!postsFound.isEmpty()) {
                resultSet.addAll(postsFound);
            }
        }
        return resultSet.stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(Post::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::convertToGetResponse)
                .collect(Collectors.toList());
    }

    private GetPostResponse convertToGetResponse(Post post) {
        if (post == null) {
            return null;
        }
        String creatorUsername = (post.getUser() != null) ? post.getUser().getUsername() : null;
        return new GetPostResponse(
                post.getPostId(),
                post.getContent(),
                post.getCreatedAt(),
                post.getLikes(),
                creatorUsername,
                post.getPhotoUrl(),
                post.getComments()
        );

    }
}

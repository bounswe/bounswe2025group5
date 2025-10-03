package com.example.CMPE451.service;

import com.example.CMPE451.model.wikidata.SparqlResponse;
import com.example.CMPE451.model.wikidata.WikidataSearchResponse;
import com.example.CMPE451.model.wikidata.WikidataSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class WikidataLookUpService {

    private final WebClient.Builder webClientBuilder;

    public Mono<WikidataSearchResult> findTopEntity(String query, String language) {

        final String WIKIDATA_API_ENDPOINT = "https://www.wikidata.org/w/api.php";
        final Duration TIMEOUT_DURATION = Duration.ofSeconds(10);

        URI uri = UriComponentsBuilder.fromHttpUrl(WIKIDATA_API_ENDPOINT)
                .queryParam("action", "wbsearchentities")
                .queryParam("format", "json")
                .queryParam("language", language)
                .queryParam("uselang", language)
                .queryParam("search", query)
                .queryParam("limit", 1)
                .build()
                .toUri();

        return this.webClientBuilder.build()
                .get()
                .uri(uri)
                .retrieve()
                .onStatus(HttpStatusCode::isError, clientResponse ->
                        clientResponse.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(new WebClientResponseException(
                                      "Wikidata API error",
                                      clientResponse.statusCode().value(),
                                      clientResponse.statusCode().toString(),
                                      clientResponse.headers().asHttpHeaders(),
                                      body.getBytes(),
                                      null
                              )))
                )
                .bodyToMono(WikidataSearchResponse.class)
                .timeout(TIMEOUT_DURATION)
                .flatMap(response -> {
                    if (response != null && response.getSearch() != null && !response.getSearch().isEmpty()) {
                        WikidataSearchResult topResult = response.getSearch().getFirst();
                        if (topResult.getId() != null && topResult.getId().matches("Q\\d+")) {
                            return Mono.just(topResult);
                        } else {
                            return Mono.empty();
                        }
                    }
                    return Mono.empty();
                });
    }


    public Mono<SparqlResponse> executeSparqlQuery(String sparqlQuery) {
        final String WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
        final Duration TIMEOUT_DURATION = Duration.ofSeconds(45);
        URI uri = UriComponentsBuilder.fromHttpUrl(WIKIDATA_SPARQL_ENDPOINT)
                .queryParam("query", sparqlQuery)
                .queryParam("format", "json")
                .build()
                .toUri();
        return this.webClientBuilder.build()
                .get()
                .uri(uri)
                .retrieve()
                .onStatus(HttpStatusCode::isError, clientResponse ->
                                clientResponse.bodyToMono(String.class)
                                        .defaultIfEmpty("")
                                        .flatMap(body -> Mono.error(new WebClientResponseException(
                                                "Wikidata SPARQL GET error",
                                                clientResponse.statusCode().value(),
                                                clientResponse.statusCode().toString(),
                                                clientResponse.headers().asHttpHeaders(),
                                                body.getBytes(),
                                                null
                                        )))

                )
                .bodyToMono(SparqlResponse.class)
                .timeout(TIMEOUT_DURATION);
    }
}
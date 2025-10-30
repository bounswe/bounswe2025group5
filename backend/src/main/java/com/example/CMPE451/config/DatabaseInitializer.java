package com.example.CMPE451.config;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer {

    private final QdrantClient client;

    public DatabaseInitializer(QdrantClient client) {
        this.client = client;
    }


    @PostConstruct
    public void setupQdrantCollection() {
        try {
            boolean collectionExists = client.listCollectionsAsync()
                    .get()
                    .stream()
                    .anyMatch(collectionName -> collectionName.equals(AppConfig.COLLECTION_NAME));

            if (!collectionExists) {
                System.out.println("Creating Qdrant collection: " + AppConfig.COLLECTION_NAME);

                client.createCollectionAsync(
                        CreateCollection.newBuilder()
                                .setCollectionName(AppConfig.COLLECTION_NAME)
                                .setVectorsConfig(
                                        VectorsConfig.newBuilder()
                                                .setParams(
                                                        VectorParams.newBuilder()
                                                                .setSize(AppConfig.VECTOR_DIMENSION)
                                                                .setDistance(Distance.Cosine)
                                                )
                                )
                                .build()
                ).get();
            }
        } catch (Exception e) {
            throw new RuntimeException("Could not create Qdrant collection", e);
        }
    }
}
package com.example.CMPE451.config;

import ai.djl.Application;
import ai.djl.ModelException;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class AppConfig {

    public static final String COLLECTION_NAME = "forum_posts";
    public static final int VECTOR_DIMENSION = 384;

    @Value("${qdrant.host}")
    private String qdrantHost;

    @Value("${qdrant.grpc.port}")
    private int qdrantPort;

    @Bean
    public QdrantClient qdrantClient() {
        return new QdrantClient(
                QdrantGrpcClient.newBuilder(qdrantHost, qdrantPort, false).build()
        );
    }

    @Bean
    public ZooModel<String, float[][]> huggingFaceModel() throws ModelException, IOException {
        String modelUrl = "djl://ai.djl.huggingface.pytorch/sentence-transformers/all-MiniLM-L6-v2";

        Criteria<String, float[][]> criteria = Criteria.builder()
                .optApplication(Application.NLP.TEXT_EMBEDDING)
                .setTypes(String.class, float[][].class)
                .optModelUrls(modelUrl)
                .optProgress(new ProgressBar())
                .build();
        return criteria.loadModel();
    }

    @Bean
    public Predictor<String, float[][]> embeddingPredictor(ZooModel<String, float[][]> model) {
        return model.newPredictor();
    }

    /**
     * Creates the "forum_posts" collection in Qdrant on startup if it doesn't exist.
     */
    @PostConstruct
    public void setupQdrantCollection() {
        QdrantClient client = qdrantClient();
        try {

            boolean collectionExists = client.listCollectionsAsync()
                    .get()
                    .stream()
                    .anyMatch(collectionName -> collectionName.equals(COLLECTION_NAME));

            if (!collectionExists) {
                System.out.println("Creating Qdrant collection: " + COLLECTION_NAME);

                client.createCollectionAsync(
                        CreateCollection.newBuilder() // Use CreateCollection
                                .setCollectionName(COLLECTION_NAME)
                                .setVectorsConfig(
                                        VectorsConfig.newBuilder()
                                                .setParams(
                                                        VectorParams.newBuilder()
                                                                .setSize(VECTOR_DIMENSION)
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
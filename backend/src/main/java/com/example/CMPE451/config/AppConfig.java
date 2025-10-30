package com.example.CMPE451.config;

import ai.djl.Application;
import ai.djl.ModelException;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
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
    public ZooModel<String, float[]> huggingFaceModel() throws ModelException, IOException {
        String modelUrl = "djl://ai.djl.huggingface.pytorch/sentence-transformers/all-MiniLM-L6-v2";

        Criteria<String, float[]> criteria = Criteria.builder()
                .optApplication(Application.NLP.TEXT_EMBEDDING)
                .setTypes(String.class, float[].class) // Changed from float[][]
                .optModelUrls(modelUrl)
                .optProgress(new ProgressBar())
                .build();
        return criteria.loadModel();
    }

    @Bean
    public Predictor<String, float[]> embeddingPredictor(ZooModel<String, float[]> model) {
        return model.newPredictor();
    }
}
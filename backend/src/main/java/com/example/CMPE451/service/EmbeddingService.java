package com.example.CMPE451.service;

import ai.djl.inference.Predictor;
import ai.djl.translate.TranslateException;
import org.springframework.stereotype.Service;

@Service
public class EmbeddingService {

    private final Predictor<String, float[]> predictor;

    public EmbeddingService(Predictor<String, float[]> predictor) {
        this.predictor = predictor;
    }


    public float[] createEmbedding(String text) {
        try {
            return predictor.predict(text);
        } catch (TranslateException e) {
            throw new RuntimeException("Failed to create embedding", e);
        }
    }
}
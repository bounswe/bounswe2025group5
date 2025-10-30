package com.example.CMPE451.service;

import com.example.CMPE451.config.AppConfig;
import io.qdrant.client.QdrantClient;

import io.qdrant.client.grpc.Points.PointId;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.SearchPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import io.qdrant.client.grpc.Points.Vectors;
import io.qdrant.client.grpc.Points.Vector;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VectorDBService {

    private final QdrantClient client;

    public VectorDBService(QdrantClient client) {
        this.client = client;
    }


    public void upsertVector(Integer postId, float[] vector) {
        List<Float> vectorList = new ArrayList<>();
        for (float f : vector) {
            vectorList.add(f);
        }

        Vectors vectors = Vectors.newBuilder()
                .setVector(Vector.newBuilder().addAllData(vectorList).build())
                .build();

        PointId id = PointId.newBuilder().setNum(postId).build();

        PointStruct point = PointStruct.newBuilder()
                .setId(id)
                .setVectors(vectors)
                .build();

        try {
            client.upsertAsync(AppConfig.COLLECTION_NAME, List.of(point)).get();
        } catch (Exception e) {
            throw new RuntimeException("Failed to upsert vector", e);
        }
    }


    public List<Integer> search(float[] queryVector, int limit) {
        List<Float> vectorList = new ArrayList<>();
        for (float f : queryVector) {
            vectorList.add(f);
        }

        SearchPoints searchPoints = SearchPoints.newBuilder()
                .setCollectionName(AppConfig.COLLECTION_NAME)
                .setLimit(limit)
                .addAllVector(vectorList)
                .build();

        try {
            List<ScoredPoint> results = client.searchAsync(searchPoints).get();

            return results.stream()
                    .map(sp -> (int) sp.getId().getNum())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("Failed to search vectors", e);
        }
    }
}
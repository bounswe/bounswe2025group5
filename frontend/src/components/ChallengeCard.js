import React, { useState } from "react";

export default function ChallengeCard({ challenge, onAction }) {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const {
        challengeId,
        name,
        amount,
        description,
        startDate,
        endDate,
        status,
        wasteType,
        attendee,
    } = challenge;

    const username = localStorage.getItem("username");

    const handleJoin = async () => {
        if (status !== "Active") {
            setError("Challenge is not active.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/challenges/attend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    challengeId,
                }),
            });

            if (res.ok) {
                onAction();
            } else {
                const data = await res.json();
                setError(data.message || "Failed to join challenge.");
            }
        } catch (err) {
            setError("Join error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/challenges/leave/${username}/${challengeId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                onAction();
            } else {
                const data = await res.json();
                setError(data.message || "Failed to leave challenge.");
            }
        } catch (err) {
            setError("Leave error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: attendee ? "#e0ffe0" : "#fff",
                marginBottom: "1rem",
                position: "relative",
            }}
        >
            <h3>{name}</h3>
            <p>{description}</p>
            <p><strong>Waste Type:</strong> {wasteType}</p>
            <p><strong>Amount:</strong> {amount}</p>
            <p><strong>From:</strong> {startDate} <strong>To:</strong> {endDate}</p>
            <p><strong>Status:</strong> {status}</p>

            {loading ? (
                <p style={{ color: "gray" }}>Processing...</p>
            ) : attendee ? (
                <button onClick={handleLeave}>Leave</button>
            ) : (
                <button onClick={handleJoin}>Join</button>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

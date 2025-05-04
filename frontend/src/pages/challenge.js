import React, { useState, useEffect } from 'react';
import ChallengeCard from '../components/ChallengeCard';

export default function Challenge() {
    const [username] = useState(localStorage.getItem("username"));
    const [challenges, setChallenges] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchChallenges = async () => {
        try {
            const response = await fetch(`/api/challenges?username=${username}`);
            const data = await response.json();
            if (response.ok) {
                setChallenges(data);
            } else {
                setError(data.message || "Failed to fetch challenges");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    if (loading) return <p>Loading challenges...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h1>Post Feed</h1>
            {challenges.map(c => (  // ıterate over posts and render PostCard for each post
                <ChallengeCard key={c.challengeId} challenge={c} onAction={fetchChallenges}/>
            ))}
        </div>
    );
}

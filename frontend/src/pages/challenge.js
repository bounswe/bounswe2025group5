import React, { useState, useEffect } from 'react';
import ChallengeCard from '../components/ChallengeCard';
import LeaderboardCard from '../components/LeaderboardCard';

export default function Challenge({ url }) {
    const [username] = useState(localStorage.getItem("username"));
    const [challenges, setChallenges] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedChallengeId, setSelectedChallengeId] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const fetchChallenges = async () => {
        try {
            const response = await fetch(`${url}/api/challenges?username=${username}`);
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

    const handleCardClick = (challengeId) => {
        setSelectedChallengeId(challengeId);
        setShowLeaderboard(true);
    };

    const handleCloseLeaderboard = () => {
        setShowLeaderboard(false);
        setSelectedChallengeId(null);
    };

    if (loading) return <p>Loading challenges...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            <h1>Active Challenges</h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {challenges.map((challenge) => (
                    <ChallengeCard
                        key={challenge.challengeId}
                        challenge={challenge}
                        onAction={fetchChallenges}
                        onCardClick={handleCardClick}
                    />
                ))}
            </div>

            {/* Leaderboard Modal */}
            {showLeaderboard && selectedChallengeId && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <LeaderboardCard
                            challengeId={selectedChallengeId}
                            onClose={handleCloseLeaderboard}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "500px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    },
};

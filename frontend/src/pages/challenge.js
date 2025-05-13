import React, { useState, useEffect } from 'react';
import ChallengeCard from '../components/ChallengeCard';
import LeaderboardCard from '../components/LeaderboardCard';
import CreateChallengeCard from '../components/CreateChallengeCard';
import Loader from '../components/ui/spinner.js'; // Import the Loader component

export default function Challenge({ url }) {
    const [username] = useState(localStorage.getItem("username"));
    const [challenges, setChallenges] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedChallengeId, setSelectedChallengeId] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const isAdmin = localStorage.getItem("isAdmin");
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

    if (loading) {
        return (
            <div>
                <Loader size='50px' message="Loading Challenges..." /> {/* Show loading spinner */}
            </div>
        );
    }
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            {isAdmin && <CreateChallengeCard onAction={fetchChallenges} url={url} />}
            <h1>Active Challenges</h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {challenges.map((challenge) => (
                    <ChallengeCard
                        key={challenge.challengeId}
                        challenge={challenge}
                        onAction={fetchChallenges}
                        onCardClick={handleCardClick}
                        url = {url}  // Pass the URL prop to ChallengeCard
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
                            url={url} // Pass the URL prop to LeaderboardCard
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

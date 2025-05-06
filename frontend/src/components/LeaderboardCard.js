import React, { useState, useEffect } from 'react';

export default function LeaderboardCard({ challengeId, onClose }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`/api/challenges/leaderboard?id=${challengeId}`);
                const data = await response.json();
                if (response.ok) {
                    setLeaderboard(data);
                } else {
                    setError(data.message || "Failed to fetch leaderboard.");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchLeaderboard();
    }, [challengeId]);

    if (loading) return <p>Loading leaderboard...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <h3>Leaderboard</h3>
                <button onClick={onClose} style={styles.closeButton}>X</button>
            </div>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.tableHeader}>#</th>
                        <th style={styles.tableHeader}>Username</th>
                        <th style={styles.tableHeader}>Remaining Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, index) => (
                        <tr key={entry.username} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                            <td style={styles.tableCell}>{index + 1}</td>
                            <td style={styles.tableCell}>{entry.username}</td>
                            <td style={styles.tableCell}>{entry.remainingAmount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const styles = {
    card: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "600px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        position: "relative",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
    },
    closeButton: {
        padding: "8px 16px",
        backgroundColor: "#f44336",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    tableHeader: {
        padding: "8px",
        backgroundColor: "#f2f2f2",
        textAlign: "left",
        fontWeight: "bold",
        borderBottom: "2px solid #ddd",
    },
    tableCell: {
        padding: "8px",
        borderBottom: "1px solid #ddd",
        textAlign: "center",
    },
    evenRow: {
        backgroundColor: "#f9f9f9",
    },
    oddRow: {
        backgroundColor: "#fff",
    },
};

import React, { useState } from "react";

function SaveButton({ postId }) {
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const toggleSave = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${localStorage.getItem("token")}`, // Uncomment if auth added
                },
            });

            if (response.ok) {
                setSaved(prev => !prev);
            } else {
                const data = await response.json();
                setError(data.message || "Failed to save the post");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div>
            <button onClick={toggleSave} style={styles.button}>
                {saved ? "🔖 Saved" : "📄 Save"}
            </button>
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    button: {
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: "16px",
    },
    error: {
        color: "red",
        fontSize: "12px",
        marginTop: "4px"
    }
};

export default SaveButton;

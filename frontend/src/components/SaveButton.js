import React, { useState } from "react";

function SaveButton({ postId, onSave }) {
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const username = localStorage.getItem("username"); // Get the username from local storage

    const toggleSave = async () => {
        if (saved) {
            const response = await fetch(`/api/posts/unsave{username}/{postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${localStorage.getItem("token")}`, // Uncomment if auth added
                },
            });
        } else {
            try {
                const response = await fetch(`/api/posts/save`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // Authorization: `Bearer ${localStorage.getItem("token")}`, // Uncomment if auth added
                    },
                    body: JSON.stringify({
                        postId: postId,
                        userId: 2, // Send userId with the request
                    }),
                });

                if (response.ok) {
                    setSaved(prev => !prev);
                    onSave(); // Call the onSave function to refresh the posts
                } else {
                    const data = await response.json();
                    setError(data.message || "Failed to save the post");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            }
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

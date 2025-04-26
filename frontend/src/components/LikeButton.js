import React, { useState } from "react";

function LikeButton({ postId, initialLikes }) {
    const [likes, setLikes] = useState(initialLikes);
    const [liked, setLiked] = useState(false);
    const [error, setError] = useState(null);

    const toggleLike = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${localStorage.getItem("token")}`, // Uncomment if auth is added later
                },
            });

            if (response.ok) {
                if (!liked) {
                    setLikes(prev => prev + 1);
                } else {
                    setLikes(prev => prev - 1);
                }
                setLiked(!liked);
            } else {
                const data = await response.json();
                setError(data.message || "Failed to like the post");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div>
            <button onClick={toggleLike} style={styles.button}>
                {liked ? "❤️" : "🤍"} {likes}
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
        fontSize: "18px",
        marginRight: "10px"
    },
    error: {
        color: "red",
        fontSize: "12px",
        marginTop: "4px"
    }
};

export default LikeButton;

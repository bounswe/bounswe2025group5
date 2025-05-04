import React, { useState } from "react";

function LikeButton({ postId, onLike }) {
    const [likeCount, setLikeCount] = useState(0); // Initialize like count to 0
    const [liked, setLiked] = useState(false);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState(localStorage.getItem("username") || "");

    const toggleLike = async () => {
        try {
            const response = await fetch(`/api/posts/like`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${localStorage.getItem("token")}`, // Uncomment if auth is added later
                },
                body: JSON.stringify({
                    username: username,
                    postId: postId,
                }),
            });

            if (response.ok) {
                setLikeCount(response.totalLikes);
                setLiked(true);
                onLike(); // Call the onLike function passed as a prop to update the parent component
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
                {liked ? "❤️" : "🤍"} {likeCount}
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

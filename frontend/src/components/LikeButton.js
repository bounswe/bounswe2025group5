import React, { useState } from "react";

function LikeButton({ postId, onLike, liked, likes, url }) {
    const [likeCount, setLikeCount] = useState(likes || 0); // Initialize likeCount with the number of likes from the post
    const [error, setError] = useState(null);
    const [username, setUsername] = useState(localStorage.getItem("username") || "");

    const toggleLike = async () => {
        if (liked) {
            const res = await fetch(`${url}/api/posts/like`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${localStorage.getItem("token")}`, // Uncomment if auth is added later
                },
                body: JSON.stringify({
                    username: username,
                    postId: postId,
                }),
            });
            if (res.ok) {
                setLikeCount(prevCount => prevCount - 1); // Decrease the like count
                liked = false; // Set liked to false
                onLike(); // Call the onLike function passed as a prop to update the parent component
            } else {
                const data = await res.json();
                setError(data.message || "Failed to unlike the post");
            }
        } else {
            try {
                const response = await fetch(`${url}/api/posts/like`, {
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
                const data = await response.json();
                if (response.ok) {
                    setLikeCount(prevCount => liked ? prevCount - 1 : prevCount + 1); // Update the like count based on the current state
                    liked = !liked; // Toggle the liked state
                    onLike(); // Call the onLike function passed as a prop to update the parent component
                } else {
                    setError(data.message || "Failed to like the post");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            }
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

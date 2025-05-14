import React, { useState } from "react";

function LikeButton({ postId, onLike, liked, likes, url }) {
    const [likedState, setLiked] = useState(liked); // Initialize liked state
    const [likeCount, setLikeCount] = useState(likes || 0); // Initialize likeCount with the number of likes from the post
    const [error, setError] = useState(null);
    const [username, setUsername] = useState(localStorage.getItem("username") || "");
    const [isPending, setIsPending] = useState(false);

    const toggleLike = async () => {
        if (isPending) return; // Prevent multiple clicks while pending
        setIsPending(true); // Set pending state to true to prevent multiple clicks
        setLiked(!likedState); // Toggle the liked state
        setLikeCount(likedState ? likeCount - 1 : likeCount + 1); // Update the like count based on the current state
        if (likedState) {
            try {
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
                onLike(); // Call the onLike function passed as a prop to update the parent component
            } else {
                setLikeCount(previous => previous + 1); // Decrease the like count
                setLiked(true); // Set liked to false
                const data = await res.json();
                setError(data.message || "Failed to unlike the post");
            }
            }
            catch (err) {
                setLikeCount(previous => previous + 1); // Decrease the like count
                setLiked(true); // Set liked to false
                setError("An error occurred. Please try again.");
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
                    //onLike(); // Call the onLike function passed as a prop to update the parent component
                } else {
                    setLikeCount(previous => previous - 1); // Update the like count based on the current state
                    setLiked(false); // Toggle the liked state
                    setError(data.message || "Failed to like the post");
                }
            } catch (err) {
                setLikeCount(previous => previous - 1); // Update the like count based on the current state
                setLiked(false); // Toggle the liked state
                setError("An error occurred. Please try again.");
            }
        }
        setIsPending(false); // Reset pending state after the operation
    };

    return (
        <div>
            <button onClick={toggleLike} style={styles.button}>
                {likedState ? "❤️" : "🤍"} {likeCount}
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

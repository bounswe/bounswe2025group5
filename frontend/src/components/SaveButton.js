import React, { useState } from "react";

function SaveButton({ postId, onSave, saved, url }) {
    const [savedState, setSaved] = useState(saved); // Initialize saved state
    const [error, setError] = useState(null);
    const username = localStorage.getItem("username"); // Get the username from local storage
    const [isPending, setIsPending] = useState(false);
    const toggleSave = async () => {
        if (isPending) return; // Prevent multiple clicks while pending
        setIsPending(true); // Set pending state to true to prevent multiple clicks
        setSaved(!savedState); // Toggle the saved state
        if (savedState) {
            try {
                const response = await fetch(`${url}/api/posts/unsave${username}/${postId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        // Authorization: `Bearer ${localStorage.getItem("token")}`, // Uncomment if auth added
                    },
                });

                if (response.ok) {
                    //onSave(); // Call the onSave function to refresh the posts
                }
                else {
                    setSaved(true); // Update the saved state to false
                    const data = await response.json();
                    setError(data.message || "Failed to unsave the post");
                }
            } catch (err) {
                setSaved(true); // Update the saved state to false
                setError("An error occurred. Please try again.");
            }
        } else {
            try {
                const response = await fetch(`${url}/api/posts/save`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // Authorization: `Bearer ${localStorage.getItem("token")}`, // Uncomment if auth added
                    },
                    body: JSON.stringify({
                        postId: postId,
                        username: username, // Send userId with the request
                    }),
                });

                if (response.ok) {
                    //onSave(); // Call the onSave function to refresh the posts
                } else {
                    setSaved(false); // Update the saved state to true
                    const data = await response.json();
                    setError(data.message || "Failed to save the post");
                }
            } catch (err) {
                setSaved(false); // Update the saved state to true
                setError("An error occurred. Please try again.");
            }
        }
        setIsPending(false); // Reset pending state after the operation
    };

    return (
        <div>
            <button onClick={toggleSave} style={styles.button}>
                {savedState ? "🔖 Saved" : "📄 Save"}
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

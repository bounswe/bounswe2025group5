import React, { useState } from "react";

function CreatePostButton({ onPostCreated}) {
    const [content, setContent] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [username, setUsername] = useState(localStorage.getItem("username") || ""); // Get username from local storage

    const handleCreatePost = async () => {
        if (!content.trim()) {
            setError("Post content cannot be empty.");
            setSuccess(null);
            return;
        }

        try {
            const response = await fetch("/api/posts/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    //...(token && { "Authorization": `Bearer ${token}` }), // if token needed
                },
                body: JSON.stringify({
                    "content": content.trim(),
                    "photoUrl": photoUrl.trim() || null,
                    "username": username,
                }),
            });

            if (response.ok) {
                setContent("");
                setPhotoUrl("");
                setError(null);
                setSuccess("Post created successfully!");
                if (onPostCreated) onPostCreated();
            } else {
                setError("Failed to create post.");
                setSuccess(null);
            }
        } catch (error) {
            console.error("Error creating post:", error);
            setError("An unexpected error occurred.");
            setSuccess(null);
        }
    };

    return (
        <div style={styles.container}>
            <h3>Create a Post</h3>
            <textarea
                style={styles.textarea}
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <input
                style={styles.input}
                type="text"
                placeholder="Optional Photo URL"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
            />
            <button style={styles.button} onClick={handleCreatePost}>Post</button>
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}
        </div>
    );
}

const styles = {
    container: {
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "24px",
        backgroundColor: "#f5f5f5",
    },
    textarea: {
        width: "100%",
        minHeight: "80px",
        padding: "8px",
        marginBottom: "8px",
        resize: "vertical",
    },
    input: {
        width: "100%",
        padding: "8px",
        marginBottom: "8px",
    },
    button: {
        padding: "8px 16px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    error: {
        color: "red",
        marginTop: "8px",
    },
    success: {
        color: "green",
        marginTop: "8px",
    },
};

export default CreatePostButton;

import React, { useState } from "react";

function EditPostButton({ post, onPostUpdated }) {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(post.content);
    const [photoUrl, setPhotoUrl] = useState(post.photoUrl || "");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const updatedPost = {
            content,
            photoUrl,
            username: localStorage.getItem("username") // Get the username from local storage
        };

        try {
            const response = await fetch(`/api/posts/edit/${post.postId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization header if needed
                },
                body: JSON.stringify(updatedPost)
            });

            if (response.ok) {
                setIsEditing(false);
                onPostUpdated(); // refetch posts
            } else {
                console.error("Failed to update post");
            }
        } catch (err) {
            console.error("Error updating post", err);
        }
    };

    return (
        <div style={{ marginTop: "0.5rem" }}>
            <button onClick={() => setIsEditing(true)}>Edit</button>

            {isEditing && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <h3>Edit Post</h3>
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows="4"
                                cols="40"
                                required
                            />
                            <br />
                            <input
                                type="text"
                                value={photoUrl}
                                onChange={(e) => setPhotoUrl(e.target.value)}
                                placeholder="Photo URL (optional)"
                            />
                            <br />
                            <button type="submit">Save</button>
                            <button type="button" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: "#fff",
    padding: "1rem",
    borderRadius: "8px",
    minWidth: "300px"
};

export default EditPostButton;

import React, { useState } from "react";

function CreatePostButton({ onPostCreated, url }) {
    const [content, setContent] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const username = localStorage.getItem("username") || "";

    const handleCreatePost = async () => {
        if (!content.trim()) {
            setError("Post content cannot be empty.");
            setSuccess(null);
            return;
        }

        const formData = new FormData();
        formData.append("content", content.trim());
        formData.append("username", username);
        if (photoFile) {
            formData.append("photoFile", photoFile); // Backend expects "photo"
        }

        try {
            const response = await fetch(`${url}/api/posts/create`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                setContent("");
                setPhotoFile(null);
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
        <div className="card mb-4 shadow">
            <div className="card-body">
                <h5 className="card-title">Create a Post</h5>
                <div className="mb-3">
                    <textarea
                        className="form-control"
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="4"
                        required
                    />
                </div>
                <div className="mb-3">
                    <input
                        className="form-control"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files[0])}
                    />
                </div>
                <button className="btn btn-info" onClick={handleCreatePost}>
                    Post
                </button>
                {error && <div className="text-danger mt-2">{error}</div>}
                {success && <div className="text-success mt-2">{success}</div>}
            </div>
        </div>
    );
}

export default CreatePostButton;

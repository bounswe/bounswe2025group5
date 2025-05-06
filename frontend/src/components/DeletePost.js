import React from "react";

function DeletePost({ postId, onDelete }) {
    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/posts/delete/${postId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization header if needed
                },
            });

            if (response.ok) {
                onDelete(postId); // Call the onDelete callback to update the UI
            } else {
                console.error("Failed to delete post");
            }
        } catch (err) {
            console.error("Error deleting post", err);
        }
    };

    return (
        <button onClick={handleDelete} style={{ color: "red" }}>
            Delete Post
        </button>
    );
}
export default DeletePost;
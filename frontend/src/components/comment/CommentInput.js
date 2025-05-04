import React, { useState } from "react";
function CommentInput({ onAddComment, isLoggedIn }) {
    const [commentText, setCommentText] = useState("");
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert("You must be logged in to post a comment.");
            return;
        }
        if (commentText.trim()) {
            onAddComment(commentText.trim());
            setCommentText("");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isLoggedIn ? "Write a comment..." : "Login to comment"}
                disabled={!isLoggedIn}
                style={{ width: "80%", padding: "8px" }}
            />
            <button type="submit" disabled={!isLoggedIn} style={{ marginLeft: "8px" }}>
                Post
            </button>
        </form>
    );
}

export default CommentInput;

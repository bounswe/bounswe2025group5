import React, { useState, useEffect } from "react";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

function CommentSection({ postId, isLoggedIn }) {
    const [comments, setComments] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await fetch(`/api/comments/post/${postId}`, { // get comments api url is /api/comments/post/{postId}
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                if (response.ok) {
                    const data = await response.json();
                    setComments(data.comments);
                } else {
                    const data = await response.json();
                    setError(data.message || "Failed to load comments");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            }
        };

        fetchComments();
    }, [postId]);

    const handleAddComment = async (content) => {
        const username = localStorage.getItem("username");
        try {
            const response = await fetch(`/api/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, content, postId}),
            });

            if (response.ok) {
                const newComment = await response.json();
                setComments(prev => [newComment, ...prev]);
            } else {
                const data = await response.json();
                setError(data.message || "Failed to add comment");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div style={{ marginTop: "1rem" }}>
            <h4>Comments</h4>
            <CommentInput onAddComment={handleAddComment} isLoggedIn={isLoggedIn} />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <CommentList comments={comments} />
        </div>
    );
}

export default CommentSection;

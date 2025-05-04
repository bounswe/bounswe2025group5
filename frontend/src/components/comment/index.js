import React, { useState, useEffect } from "react";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

function CommentSection({ postId, isLoggedIn }) {
    const [comments, setComments] = useState([]);
    const [error, setError] = useState(null);
    const [commentBeingEdited, setCommentBeingEdited] = useState(null); // State to track the comment being edited   
    const [username, setUsername] = useState(localStorage.getItem("username")); // Get the username from local storage
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
        if (commentBeingEdited) {
            commentBeingEdited.content = content; // Update the content of the comment being edited
            try {
                const response = await fetch(`/api/comments/${commentBeingEdited.commentId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, content, postId }),
                });
                if (response.ok) {

                    setCommentBeingEdited(null); // Clear the comment being edited
                } else {
                    const data = await response.json();
                    setError(data.message || "Failed to update comment");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            }
            return;
        } else {
            try {
                const response = await fetch(`/api/comments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, content, postId }),
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
        }
    };
    const handleDelete = (commentId) => {
        setComments(comments.filter((c) => c.commentId !== commentId));
        fetch(`/api/comments/${commentId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to delete comment");
                }
            })
            .catch((error) => {
                setError(error.message);
            });
    };

    const handleEditClick = (comment) => {
        setCommentBeingEdited(comment);
    };

    const handleCancelEdit = () => {
        setCommentBeingEdited(null);
    };

    return (
        <div style={{ marginTop: "1rem"}}>
            <h4>Comments</h4>
            <CommentInput onAddComment={handleAddComment} isLoggedIn={isLoggedIn} commentBeingEdited={commentBeingEdited}
                onCancelEdit={handleCancelEdit} />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <CommentList comments={comments} onDelete={handleDelete} onUpdate={handleEditClick} username={username}/>
        </div>
    );
}
export default CommentSection;

import React from "react";

function CommentList ({ comments, onUpdate, onDelete, username }) {
    if (!comments || comments.length === 0) {
        return <p>No comments yet.</p>;
    }

    return (
        <ul style={{ listStyle: "none", padding: 0 }}>
            {comments.map(comment => (
                <li
                    key={comment.commentId}
                    style={{
                        borderBottom: "1px solid #ccc",
                        padding: "0.5rem 0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div style={{ fontSize: "1rem" }}>
                        <strong>{comment.creatorUsername}:</strong> {comment.content}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "gray", marginLeft: "1rem" }}>
                        {new Date(comment.createdAt).toLocaleString()}
                    </div>
                    {comment.creatorUsername === username && (
                        <div style={{ marginLeft: "1rem" }}>
                            <button onClick={() => onUpdate(comment)} style={{ marginRight: "0.5rem" }}>
                                Update
                            </button>
                            <button onClick={() => onDelete(comment.commentId)}>Delete</button>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
};
export default CommentList;
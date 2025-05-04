import React from "react";

function CommentList({ comments }) {

    if (!comments || comments.length === 0) {
        return <p>No comments yet.</p>;
    }
    return (
        <ul style={{ listStyle: "none", padding: 0 }}>
            {comments.map(comment => (
                <li key={comment.commentId} style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <strong>{comment.creatorUsername}</strong>: {comment.content}
                        </div>
                        <small style={{ fontSize: "0.75rem", color: "#666" }}>
                            {new Date(comment.createdAt).toLocaleString()}
                        </small>
                    </div>
                    <hr />
                </li>
            ))}
        </ul>
    );

}

export default CommentList;

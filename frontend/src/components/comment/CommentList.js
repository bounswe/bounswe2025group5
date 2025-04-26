import React from "react";

function CommentList({ comments }) {
    if (!comments || comments.length === 0) {
        return <p>No comments yet.</p>;
    }

    return (
        <ul>
            {comments.map((comment) => (
                <li key={comment.commentId}>
                    <strong>{comment.commenterUsername}:</strong> {comment.content}
                </li>
            ))}
        </ul>
    );
}

export default CommentList;

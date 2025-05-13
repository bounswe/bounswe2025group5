import React from "react";
import 'bootstrap-icons/font/bootstrap-icons.css'; // Ensure this is imported somewhere globally if not already

function CommentList({ comments, onUpdate, onDelete, username }) {
    if (!comments || comments.length === 0) {
        return <p className="text-muted">No comments yet.</p>;
    }

    return (
        <ul className="list-unstyled">
            {comments.map((comment) => (
                <li
                    key={comment.commentId}
                    className="border-bottom py-2 d-flex flex-column"
                >
                    <div className="d-flex justify-content-between align-items-start">
                        <div style={{ fontSize: '1.2rem' }}>
                            <strong>@{comment.creatorUsername}</strong>{" "}
                            <span className="text-muted">{comment.content}</span>
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {new Date(comment.createdAt).toLocaleString()}
                        </small>
                    </div>

                    {comment.creatorUsername === username && (
                        <div className="mt-1 d-flex gap-2">
                            <button
                                className="btn btn-sm text-info"
                                onClick={() => onUpdate(comment)}
                                title="Edit"
                                style={{ padding: "0.1rem 0.3rem" }}
                            >
                                <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                                className="btn btn-sm text-danger"
                                onClick={() => onDelete(comment.commentId)}
                                title="Delete"
                                style={{ padding: "0.1rem 0.3rem" }}
                            >
                                <i className="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

export default CommentList;

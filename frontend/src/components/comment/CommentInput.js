import React, { useEffect, useState } from "react";

function CommentInput({ onAddComment, isLoggedIn, commentBeingEdited, onCancelEdit }) {
    const [commentText, setCommentText] = useState("");

    useEffect(() => {
        if (commentBeingEdited) {
            setCommentText(commentBeingEdited.content);
        } else {
            setCommentText("");
        }
    }, [commentBeingEdited]);

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

    if (!isLoggedIn) {
        return <p className="text-muted">You must be logged in to comment.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="mb-3">
            <div className="mb-2">
                <textarea
                    className="form-control"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    placeholder="Write a comment..."
                />
            </div>
            <div className=" gap-6 justify-content-end "> 
                <button type="submit" className="btn btn-info btn-sm">
                    {commentBeingEdited ? "Update" : "Post"}
                </button>
                {commentBeingEdited && (
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={onCancelEdit}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export default CommentInput;

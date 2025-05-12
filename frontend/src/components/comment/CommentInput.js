import React, { use, useState } from "react";
import { useEffect } from "react";
function CommentInput({ onAddComment, isLoggedIn ,commentBeingEdited, onCancelEdit}) {

    const [commentText, setCommentText] = useState("");
    useEffect(() => {
        if (commentBeingEdited) {
            setCommentText(commentBeingEdited.content);
        }else {
            setCommentText("");
        }
    }
    , [commentBeingEdited]);

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

    return isLoggedIn ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                style={{ width: "100%" }}
                placeholder="Write a comment..."
            />
            <div>
                <button type="submit" style={{ marginTop: "0.5rem" }}>
                    {commentBeingEdited ? "Update" : "Post"}
                </button>
                {commentBeingEdited && (
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        style={{ marginLeft: "0.5rem" }}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    ) : (
        <p>You must be logged in to comment.</p>
    );
};

export default CommentInput;

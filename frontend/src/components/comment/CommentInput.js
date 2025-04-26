import React, { useState } from "react";

function CommentInput({ onAddComment }) {
    const [text, setText] = useState("");

    const handleSubmit = () => {
        if (text.trim()) {
            onAddComment(text);
            setText("");
        }
    };

    return (
        <div style={{ display: "flex", marginBottom: "1rem" }}>
            <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write a comment..."
                style={{
                    flex: 1,
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                }}
            />
            <button
                onClick={handleSubmit}
                style={{
                    marginLeft: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                }}
            >
                Post
            </button>
        </div>
    );
}

export default CommentInput;

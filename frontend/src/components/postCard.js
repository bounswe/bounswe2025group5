import React, { useState } from "react";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import CommentSection from "./comment/index.js"; // Import the CommentSection component

function PostCard({ post }) {
    const [comments, setComments] = useState(post.comments || []);

    return (
        <div style={styles.card}>
            <h3>{post.creatorUsername}</h3>
            <p>{post.content}</p>

            {post.photoUrl && (
                <img src={post.photoUrl} alt="Post" style={{ maxWidth: "60%", marginTop: "10px" }} />
            )}

            <div style={styles.footer}>
                <small>Likes: {post.likes}</small>
                <small>Posted on: {new Date(post.createdAt).toLocaleString()}</small>
            </div>

            <div style={styles.actions}>
                <LikeButton postId={post.postId} />
                <SaveButton postId={post.postId} />
            </div>

            {/* Comment Section */}
            <CommentSection
                postId={post.postId}
                comments={comments}
                setComments={setComments}
            />
        </div>
    );
}

const styles = {
    card: {
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
        backgroundColor: "#f9f9f9"
    },
    footer: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "8px",
        fontSize: "12px",
        color: "#666"
    },
    actions: {
        display: "flex",
        gap: "10px",
        marginTop: "10px"
    }
};

export default PostCard;

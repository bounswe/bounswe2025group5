import React, { useState } from "react";
import LikeButton from "./LikeButton.js";
import SaveButton from "./SaveButton.js";
import CommentSection from "./comment/index.js"; // Import the CommentSection component
import EditPostButton from "./EditPostButton.js";
import DeletePost from "./DeletePost.js"; // Import the DeletePost component

function PostCard({ post, isLoggedIn, onAction, url }) {
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

            {isLoggedIn && (
                <div style={styles.actions}>
                    <LikeButton postId={post.postId} onLike={onAction} liked={post.liked} likes={post.likes} url={url}/>
                    <SaveButton postId={post.postId} onSave={onAction} saved={post.saved} url={url}/>
                </div>
            )}

            {isLoggedIn && post.creatorUsername === localStorage.getItem("username") && (
                <>
                <EditPostButton post={post} onPostUpdated={onAction} url={url} />
                <DeletePost postId={post.postId} onDelete={onAction} url={url} />
                </>
            )}
            <hr style={{ margin: "2rem 0", borderTop: "2px solid #ccc" }} />
            {/* Comment Section */}
            <CommentSection
                postId={post.postId}
                comments={comments}
                setComments={setComments}
                isLoggedIn={isLoggedIn}
                url={url} // Pass the URL prop to CommentSection
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

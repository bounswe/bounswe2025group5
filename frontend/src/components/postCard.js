import React from "react";

//post has a creatorUsername, content, likes, createdAt, postId and optionally a pohotoUrl
function PostCard({ post }) {
    return (
        <div style={styles.card}>
            <h3>{post.creatorUsername}</h3>
            <p>{post.content}</p>
            {post.photoUrl && <img src={post.photoUrl} alt="Post" style={{ maxWidth: "100%" }} />}
            {/* You can add a like button or comment section here later */}
            {/* For now, we will just display the likes and createdAt date */}
            
            <div style={styles.footer}>
                <small>Likes: {post.likes}</small>
                <small>Posted on: {new Date(post.createdAt).toLocaleString()}</small>
            </div>
            {/* You can add comments or like button here later */}
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
    }
};

export default PostCard;

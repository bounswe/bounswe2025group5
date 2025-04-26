import React from "react";
import { useState, useEffect } from "react";
import PostCard from "../components/PostCard.js"; // Import the PostCard component

function Feed({ isLoggedIn }) {
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const [token, setToken] = useState("");
    const [username, setUserName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch("/api/posts/info?size=5", {
                    method: "GET",
                    //headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (response.ok) {
                    setPosts(data);
                    setMessage(data.message || "Posts fetched successfully.");

                    // Optional: You can also check if posts are empty and set a message accordingly
                    if (posts.length === 0) {
                        setMessage("No posts available.");
                    }
                } else {
                    setError(data.message || "Failed to fetch posts");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            } finally {
                setLoading(false); // Set loading to false after fetching data
            }
        };
        fetchPosts();
    }, [token]);

    if (loading) {
        return <div>Loading posts...</div>; // Optional: Show a loading indicator while fetching data
    }

    if (error) {
        return <div>Error: {error}</div>; // Show the error message if something goes wrong
    }

    return (
        <div>
            <h1>Post Feed</h1>
            {posts.map(post => (  // ıterate over posts and render PostCard for each post
                <PostCard key={post.postId} post={post} />
            ))}
        </div>
    );
};
export default Feed;

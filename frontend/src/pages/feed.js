import React from "react";
import { useState, useEffect } from "react";
import PostCard from "../components/PostCard.js"; // Import the PostCard component
import { Button } from "../components/ui/button.js"; // Import Material-UI Button component
import LogoutButton from "../components/LogoutButton.js"; // Import LogoutButton component
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import CreatePostButton from "../components/CreatePostButton.js"; // Import CreatePostButton component

function Feed({ isLoggedIn, setIsLoggedIn }) {
    const navigate = useNavigate(); // Hook to programmatically navigate
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const fetchSize = 10; // Number of posts to fetch at once

    const fetchPosts = async () => {
        const username = localStorage.getItem("username"); // Get the username from local storage
        try {
            const response = await fetch(`/api/posts/info?size=${fetchSize}&username=${username}`, {
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

    useEffect(() => {
        fetchPosts(); // Fetch posts when the component mounts
    }, []);

    if (loading) {
        return <div>Loading posts...</div>; // Optional: Show a loading indicator while fetching data
    }

    if (error) {
        return <div>Error: {error}</div>; // Show the error message if something goes wrong
    }


    return (
        <div>
            <h1>Post Feed</h1>
            {isLoggedIn && <CreatePostButton onPostCreated={fetchPosts} />}
            {posts.map(post => (  // ıterate over posts and render PostCard for each post
                <PostCard key={post.postId} post={post} isLoggedIn={isLoggedIn} onAction={fetchPosts}/>
            ))}
            {isLoggedIn && <LogoutButton setIsLoggedIn={setIsLoggedIn} onLogout={() => navigate('/')} />} {/* Logout button */}
        </div>
    );
};
export default Feed;

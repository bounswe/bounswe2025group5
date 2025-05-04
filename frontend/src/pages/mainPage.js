import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import LogoutButton from "../components/LogoutButton";
import PostCard from "../components/PostCard"; // Import PostCard component
import GoalCard from "../components/GoalCard";
import ChallengeCard from "../components/ChallengeCard";


export default function MainPage({ setIsLoggedIn }) {
    const navigate = useNavigate(); // Hook to programmatically navigate
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState([]);
    const [challenges, setChallenges] = useState([]);

    const username = localStorage.getItem("username"); // Get the username from local storage
    const fetchChallenges = async () => {
        try {
            const response = await fetch(`/api/challenges?username=${username}`);
            const data = await response.json();
            if (response.ok) {
                setChallenges(data);
            } else {
                setError(data.message || "Failed to fetch challenges");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };
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
                    console.log('posts successfully fetched:', data.length);
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
        const fetchGoals = async () => {
            try {
                const response = await fetch(`/api/goals/info?username=${username}&size=${5}&lastGoalId=${0}`, {
                    method: "GET",
                    //headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (response.ok) {
                    setGoals(data.username);
                    setMessage(data.message || "Goals fetched successfully.");
                    console.log('goals successfully fetched:', data.length);
                } else {
                    setError(data.message || "Failed to fetch goals");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            } finally {
                setLoading(false); // Set loading to false after fetching data
            }
        };
        
        fetchPosts();
        fetchGoals(); // Fetch goals when the component mounts
        fetchChallenges(); // Fetch challenges when the component mounts
    }, []); // Removed token dependency to avoid infinite loop

    if (loading) {
        return <div>Loading posts...</div>; // Optional: Show a loading indicator while fetching data
    }

    if (error) {
        return <div>Error: {error}</div>; // Show the error message if something goes wrong
    }

    //this will implemented better
    const handleGoalDelete = async (goalId) => {
        setGoals((prevGoals) => prevGoals.filter((goal) => goal.goal_id !== goalId));
        try {
            const response = await fetch(`/api/goals/${goalId}`, {
                method: "DELETE",
                //headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || "Goal deleted successfully.");
            } else {
                setError(data.message || "Failed to delete goal");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }

    };
    const handleGoalComplete = async (goalId) => {
        setGoals((prevGoals) => prevGoals.map((goal) => goal.goal_id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal));
        try {
            const response = await fetch(`/api/goals/${goalId}/complete`, {
                method: "POST",
                //headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || "Goal marked as completed.");
            } else {
                setError(data.message || "Failed to mark goal as completed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };
    const handleGoalEdit = async (goalId, updatedGoal) => {
        setGoals((prevGoals) => prevGoals.map((goal) => goal.goal_id === goalId ? { ...goal, ...updatedGoal } : goal));
        try {
            const response = await fetch(`/api/goals/${goalId}`, {
                method: "PUT",
                //headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(updatedGoal),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || "Goal updated successfully.");
            } else {
                setError(data.message || "Failed to update goal");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };
    return (
        <div>
            <h1>Post Feed</h1>
            {posts.map(post => (  // ıterate over posts and render PostCard for each post
                <PostCard key={post.postId} post={post} isLoggedIn={true} />
            ))}
            {goals}
            {/*goals.length > 0 && goals.map(goal => (  // ıterate over goals and render PostCard for each post
                <GoalCard key={goal.goalId} goal={goal} onDelete={handleGoalDelete} onToggleComplete={handleGoalComplete} onEdit={handleGoalEdit} />
            ))*/}
            {challenges.slice(0, 3).map(challenge => (  // Show only the first 3 challenges
                <ChallengeCard key={challenge.challengeId} challenge={challenge} onAction={fetchChallenges} />
            ))}
            {/* {isLoggedIn && <CreatePostButton onPostCreated={fetchPosts} />} */}
            {<LogoutButton setIsLoggedIn={setIsLoggedIn} onLogout={()=>navigate('/')}/>} {/* Logout button */}
        </div>
    );
}
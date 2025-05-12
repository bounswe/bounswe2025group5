import {Button} from   "./ui/button.js"; // Import Material-UI Button component
import { useState } from "react";

export default function LogoutButton({ onLogout, setIsLoggedIn }) {
    const handleLogout = () => {
        // Perform logout logic here (e.g., clear tokens, redirect, etc.)
        localStorage.removeItem("username"); // Remove the token from local storage
        localStorage.removeItem("userId"); // Remove the user ID from local storage
        localStorage.removeItem("isAdmin"); // Remove the admin status from local storage
        localStorage.removeItem("isModerator"); // Remove the moderator status from local storage
        setIsLoggedIn(false); // Update the logged-in state in the parent component
        onLogout(); // Call the onLogout function passed as a prop
    };

    return (
        <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
            Log Out
        </Button>
    );
}
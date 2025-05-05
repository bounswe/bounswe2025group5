import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import LogoutButton from "../components/LogoutButton";

const ProfilePage = ({ setIsLoggedIn, username }) => {
    const navigate = useNavigate(); // Hook to programmatically navigate
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({
        username: "",
        biography: "",
        profilePicture: ""
    });
    const [isModalOpen, setIsModalOpen] = useState(false); // State to toggle modal visibility
    const [editedUser, setEditedUser] = useState({ username: "", biography: "", profilePicture: "" }); // State for edited user data

    useEffect(() => {
        const fetchUser = async () => {
            const usernameToFetch = localStorage.getItem("username"); // Get the username from local storage
            try {
                const response = await fetch(`/api/profile/info?username=${usernameToFetch}`, {
                    method: "GET",
                });
                const data = await response.json();
                if (response.ok) {
                    setUser(data);
                    setEditedUser({ username: data.username, biography: data.biography, profilePicture: data.profilePicture });
                    setMessage(data.message || "User fetched successfully.");
                    console.log('user successfully fetched:', data);
                } else {
                    setError(data.message || "Failed to fetch user");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            } finally {
                setLoading(false); // Set loading to false after fetching data
            }
        };
        fetchUser();
    }, []);

    const handleEditProfile = () => {
        setIsModalOpen(true); // Open the modal
    };

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`/api/profile/edit`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: editedUser.username,
                    biography: editedUser.biography,
                    photoUrl: editedUser.profilePicture, // Assuming the profile picture is stored as a URL or base64 string
                }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                console.log("Profile updated successfully:", data);
                setUser(editedUser); // Update the user state with the edited data
                setMessage(data.message || "Profile updated successfully.");
                console.log('profile successfully updated:', data);
            } else {
                setError(data.message || "Failed to update profile.");
            }
        } catch (err) {
            console.error("An error occurred while updating the profile:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setIsModalOpen(false); // Close the modal
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setEditedUser((prev) => ({ ...prev, profilePicture: reader.result })); // Save the image as a base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <h1>Profile Page</h1>
            {loading ? (
                <div>Loading user...</div> // Optional: Show a loading indicator while fetching data
            ) : error ? (
                <div>Error: {error}</div> // Show the error message if something goes wrong
            ) : (
                <div>
                    <img src={user.profilePicture} alt="Profile" style={{ width: "150px", height: "150px", borderRadius: "50%" }} />
                    <h2>{user.username}</h2>
                    <p>{user.biography}</p>
                    <button onClick={handleEditProfile}>Edit Profile</button>
                </div>
            )}
            <LogoutButton onLogout={() => console.log("logged out")} setIsLoggedIn={setIsLoggedIn} />

            {/* Modal */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2>Edit Profile</h2>
                        <label>
                            Username:
                            <input
                                type="text"
                                name="username"
                                value={editedUser.username}
                                onChange={handleInputChange}
                                style={styles.input}
                            />
                        </label>
                        <label>
                            Biography:
                            <textarea
                                name="biography"
                                value={editedUser.biography}
                                onChange={handleInputChange}
                                style={styles.textarea}
                            />
                        </label>
                        <label>
                            Profile Picture:
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={styles.input}
                            />
                        </label>
                        <div style={styles.actions}>
                            <button onClick={handleSaveChanges} style={styles.button}>
                                Save Changes
                            </button>
                            <button onClick={() => setIsModalOpen(false)} style={styles.button}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        width: "400px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    },
    input: {
        display: "block",
        width: "100%",
        margin: "10px 0",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    textarea: {
        display: "block",
        width: "100%",
        margin: "10px 0",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        resize: "none",
    },
    actions: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "20px",
    },
    button: {
        padding: "10px 20px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        backgroundColor: "#007BFF",
        color: "#fff",
    },
};

export default ProfilePage;
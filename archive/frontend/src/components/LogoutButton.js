import { Button } from "react-bootstrap"; // Import Bootstrap Button
import { useState } from "react";

export default function LogoutButton({ onLogout, setIsLoggedIn }) {
    const handleLogout = () => {
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("isModerator");
        setIsLoggedIn(false);
        onLogout();
    };

    return (
        <Button
            onClick={handleLogout}
            style={{
                padding: '8px 20px',
                backgroundColor: 'rgb(214, 126, 25)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(172, 104, 26)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgb(214, 126, 25)'}
        >
            Log Out
        </Button>
    );
}

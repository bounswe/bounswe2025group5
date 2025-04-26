import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton.js';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

export default function Navbar({ setIsLoggedIn }) {
    const navigate = useNavigate(); // Hook to programmatically navigate
    return (
        <nav style={styles.navbar}>
            <ul style={styles.navList}>
                <li style={styles.navItem}>
                    <Link to="/goals" style={styles.navLink}>Goals</Link>
                </li>
                <li style={styles.navItem}>
                    <Link to="/leaderboard" style={styles.navLink}>Leaderboard</Link>
                </li>
                <li style={styles.navItem}>
                    <Link to="/feed" style={styles.navLink}>Feed</Link>
                </li>
                <li style={styles.navItem}>
                    <Link to="/main" style={styles.navLink}>Main Page</Link>
                </li>
                <li style={styles.navItem}>
                    <Link to="/profile" style={styles.navLink}>Profile</Link>
                </li>
                <li style={styles.navItem}>
                    <LogoutButton onLogout={()=>navigate('/')} setIsLoggedIn={setIsLoggedIn}/> {/* Logout button */}
                </li>
            </ul>
        </nav>
    );
}

const styles = {
    navbar: {
        backgroundColor: '#007BFF',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'center',
    },
    navList: {
        listStyleType: 'none',
        display: 'flex',
        gap: '20px',
        margin: 0,
        padding: 0,
    },
    navItem: {
        display: 'inline',
    },
    navLink: {
        color: '#fff',
        textDecoration: 'none',
        fontSize: '16px',
        fontWeight: 'bold',
    },
};
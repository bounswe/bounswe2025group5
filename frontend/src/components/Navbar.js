import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton.js';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import Nav from 'react-bootstrap/Nav';


export default function Navbar({ setIsLoggedIn }) {
    const navigate = useNavigate(); // Hook to programmatically navigate
    return (
        <Nav variant="pills" style={styles.navbar}>
            <ul style={styles.navList}>
                <li style={styles.navItem}>
                    <Nav.Link href="/goals" style={styles.navLink}>Goals</Nav.Link>
                </li>
                <li style={styles.navItem}>
                    <Nav.Link href="/challenge" style={styles.navLink}>Challenge</Nav.Link>
                </li>
                <li style={styles.navItem}>
                    <Nav.Link href="/feed" style={styles.navLink}>Feed</Nav.Link>
                </li>
                <li style={styles.navItem}>
                    <Nav.Link href="/main" style={styles.navLink}>Main Page</Nav.Link>
                </li>
                <li style={styles.navItem}>
                    <Nav.Link href="/profile" style={styles.navLink}>Profile</Nav.Link>
                </li>
                <li style={styles.navItem}>
                    <Nav.Link as="span" style={{ ...styles.navLink, marginTop: '-7px'}}>
                                        <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '8px 20px',
                        backgroundColor: 'rgb(214, 126, 25)', // Red color for the button
                        color: 'white', // White text color
                        border: 'none', // No border
                        borderRadius: '5px', // Rounded corners
                        cursor: 'pointer', // Pointer on hover
                        fontSize: '16px', // Font size
                        transition: 'background-color 0.3s', // Smooth color transition on hover
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(172, 104, 26)'} // Darker red on hover
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgb(214, 126, 25)'} // Reset to original color
                >
                    Logout
                </button>
                    </Nav.Link>
                </li>
            </ul>
        </Nav>
    );
}
const styles = {
    navbar: {
        position: 'fixed',
        top: 0,
        width: 'auto',
        backgroundColor: 'rgb(8, 75, 31)', // semi-transparent tint
        //backdropFilter: 'blur(8px)',                 // glassy blur effect
        padding: '13px 20px',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 10,                                  // sits above the bg layer
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        //adjust the height of the navbar
        height: '70px',
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
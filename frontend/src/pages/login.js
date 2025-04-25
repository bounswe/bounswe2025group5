import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

//login page with username and password fields, exports isloggedin and setisloggedin functions to be used in app.js

function Login({ setIsLoggedIn }) {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [token, setToken] = useState("");

    useEffect(() => {
        // Check if the user is already logged in
        // We assume that it will be valid infinitely for now
        setToken(localStorage.getItem('token'));
        if (token) {
            setIsLoggedIn(true);
        }
    }, [setIsLoggedIn]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, password }),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                setIsLoggedIn(true);
            } else {
                setError(data.message || 'Login failed');
                localStorage.removeItem('token');
                setIsLoggedIn(false);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };
    // Function to prepare the login form to be rendered in the app.js
    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="form-fields">
                {error && <p className="error">{error}</p>}
                <div className="form-field">
                    <input
                        type="text"
                        placeholder="Email or Username"
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-field">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">
                    Login
                </button>
            </form>
        </div>
    );
}

export default Login;

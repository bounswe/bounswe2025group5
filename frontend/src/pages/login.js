import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

//login page with username and password fields, exports isloggedin and setisloggedin functions to be used in app.js

function Login({ setIsLoggedIn }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    
    useEffect(() => {
        /* Check if the user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
        setIsLoggedIn(true);
        }*/
    }, [setIsLoggedIn]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (username === 'name' && password === 'password') {
            setIsLoggedIn(true);
        } else if (username === '' || password === '') {
            setError('Please fill in all fields');
        } else {
            setError('Invalid username or password');
        }
        /* try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                //localStorage.setItem('token', data.token);
                setIsLoggedIn(true);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } */
    };
    // Function to prepare the login form to be rendered in the app.js
    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="form-fields">
                <div className="form-field">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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

import logo from './assets/logo2.png';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import React from 'react';
import { useState, useEffect } from 'react';
import Login from './pages/login.js';
import Register from './pages/register.js';
import Feed from './pages/feed.js';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUserName] = useState('');

  useEffect(() => {
    // Check if the user is already logged in
    // We assume that it will be valid infinitely for now
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, [setIsLoggedIn]);

  return (

    <div className="App">
      <header className="App-header">
        <div className="content-container">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>Welcome, Please Login or Register</h1>

          {/* Navigation Links */}
          <div>
            <Link to="/login">Login</Link> | <Link to="/register">Register</Link> | <Link to="/feed">Feed</Link>
          </div>

          {/* Render pages based on the route */}
          <Routes>
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feed" element={<Feed isLoggedIn={isLoggedIn} />} />
          </Routes>

          {/* Optional message */}
          {isLoggedIn && <h2>You are logged in!</h2>}
        </div>
      </header>
    </div>

  );
}
export default App;

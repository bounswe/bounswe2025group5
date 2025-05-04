import logo from './assets/logo2.png';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import React, { use } from 'react';
import { useState, useEffect } from 'react';
import Login from './pages/login.js';
import Register from './pages/register.js';
import Feed from './pages/feed.js';
import HomePage from './pages/homePage.js';
import MainPage from './pages/mainPage.js';
import Navbar from './components/Navbar.js'; // Import the Navbar component

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUserName] = useState("");
  const location = useLocation(); // Get the current location from React Router
  useEffect(() => {
    // Check if the user is already logged in
    // We assume that it will be valid infinitely for now
    const cachedUsername = localStorage.getItem('username');
    if (cachedUsername) {
      setUserName(cachedUsername);
      setIsLoggedIn(true);
    }
  }, [location]);

  return (

    <div className="App">
      <header className="App-header">
      {isLoggedIn && <Navbar setIsLoggedIn={setIsLoggedIn} />} {/* Render the Navbar */}
        <div className="content-container">
          <img src={logo} className="App-logo" alt="logo" />
          {/* Render pages based on the route */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feed" element={<Feed isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/goals" element={<div>Goals Page</div>} />
            <Route path="/leaderboard" element={<div>Leaderboard Page</div>} />
            <Route path="/profile" element={<div>Profile Page</div>} />
          </Routes>
        </div>
      </header>
    </div>

  );
}
export default App;

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
import Challenge from './pages/challenge.js';
import ProfilePage from './pages/profilePage.js';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUserName] = useState("");
  const location = useLocation(); // Get the current location from React Router
  //const url = "http://161.35.42.102:8080";
  const url = ""; // Uncomment this line to use localhost

  useEffect(() => {
    // Check if the user is already logged in
    // We assume that it will be valid infinitely for now
    const cachedUsername = localStorage.getItem('username');
    if (cachedUsername) {
      setIsLoggedIn(true);
      setUserName(cachedUsername); // Set the username from local storage
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
            <Route path="/" element={<HomePage url = {url}/>} />
            <Route path="/login" element={<Login isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} url = {url} />} />
            <Route path="/register" element={<Register url = {url}/>} />
            <Route path="/feed" element={<Feed isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} url = {url} />} />
            <Route path="/main" element={<MainPage url = {url}/>} />
            <Route path="/goals" element={<div>Goals Page</div>} />
            <Route path="/challenge" element={<Challenge url = {url}/>} />
            <Route path="/profile" element={<ProfilePage setIsLoggedIn={setIsLoggedIn} username={username} url = {url}/>} />
          </Routes>
        </div>
      </header>
    </div>

  );
}
export default App;

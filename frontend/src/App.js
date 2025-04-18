import logo from './assets/logo2.png';
import './App.css';
import React from 'react';
import { useState } from 'react';
import Login from './pages/login.js';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <div className="content-container">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>Welcome, Please Login</h1>
          <Login setIsLoggedIn={setIsLoggedIn} />
          {isLoggedIn && <h2>You are logged in!</h2>}
          {/* Temporary message to show that the user is logged in */}
        </div>
      </header>
    </div>
  );
}
export default App;

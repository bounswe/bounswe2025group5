import logo from './assets/logo2.png';
import './App.css';
import React from 'react';
import { useState } from 'react';
import Login from './pages/login.js';
import Register from './pages/register.js';
import KVKK from './pages/KVKK.js'
import Unvalid from './pages/unvalid_page.js'

window.homepage_URL = 'http://localhost:3000/homepage'
window.register_URL = 'http://localhost:3000/register'
window.KVKK_URL = 'http://localhost:3000/KVKK'

function App() {
  if(window.location.href == window.homepage_URL){
    return(<p>welcome to homepage</p>);
  }
  if(window.location.href == window.register_URL){
    return(<Register/>);
  }
  if(window.location.href == window.KVKK_URL){
    return(<KVKK/>);
  }
  return (
    <Unvalid/>
  );
}
export default App;

import React from 'react';
import { useState } from 'react';
import logo from '../assets/logo2.png';


function Unvalid(){
  const unvalid_page_message = "Unvalid Page :("
  return (
    <div className="App">
      <header className="App-header">
        <div className="content-container">
          <img src={logo} className="App-logo" alt="logo" />
            <div className="register-container">
              <h1>{unvalid_page_message}</h1>                
            </div>
        </div>
      </header>
    </div>
  );
}
export default Unvalid;
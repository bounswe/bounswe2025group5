import React, { useEffect } from 'react';
import { useState } from 'react';
import logo from '../assets/logo2.png';


function Register(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [password_repeat, setPassword_repeat] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [KVKK, setKVKK] = useState(false);
    const password_manual = <div>
                                <h6 style={{ color: 'red' }}>Password must be at least 8 characters long!</h6>
                                <h6 style={{ color: 'red' }}>Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!</h6>       
                            </div>;
    const email_manual = <div>
                                <h6 style={{ color: 'red' }}>Email must contain '@' and '.'!</h6>
                                <h6 style={{ color: 'red' }}>Left side of '@' cannot empty!</h6>
                                <h6 style={{ color: 'red' }}>Right side of '.' must contain appropriate top-level domain! (Ex: com,gov,org)</h6>
                         </div>
    const successful_registration_message = <div>
                                                <h1 style={{ color: 'green' }}>Registration is succesful!</h1>
                                            </div>;
    const handleSubmit = async (page) =>{
        page.preventDefault();
        if(KVKK == false){
            setError('You must accept the KVKK!'); 
            setMessage(error);
            return;
        }
        // Checking the validity of the password
        if(password !== password_repeat){
            setError('Passwords do not match!');
            setMessage(error);
            return;
        }
        if(password.length < 8){
            setMessage(password_manual);
            return;
        }
        let password_has_number = false;
        let password_has_uppercase = false;
        let password_has_lowercase = false;
        let password_has_special = false;
        let index = 0;
        while(index < password.length){
            if(password[index] >= '0' && password[index] <= '9'){
                password_has_number = true;
            }
            if(password[index] >= 'A' && password[index] <= 'Z'){
                password_has_uppercase = true;
            }
            if(password[index] >= 'a' && password[index] <= 'z'){
                password_has_lowercase = true;
            }
            if(password[index] >= '!' && password[index] <= '/'){
                password_has_special = true;
            }
            if(password[index] >= ':' && password[index] <= '@'){
                password_has_special = true;
            }
            if(password[index] >= '[' && password[index] <= '`'){
                password_has_special = true;
            }
            if(password[index] >= '{' && password[index] <= '~'){
                password_has_special = true;
            }
            index++;
        }
        if((password_has_number && password_has_uppercase && password_has_lowercase && password_has_special) == false){
            setMessage(password_manual);
            return;
        }
        // Checking the validity of the email
        let email_at_index = 0;
        let email_dot_index = 0;
        let email_dot_is_found = false; // To only select the first '.' in the email
        index = 0;
        while(index < email.length){
            if(email[index] == '@'){
                email_at_index = index;
            }
            if(email[index] == '.' && email_dot_is_found == false){
                email_dot_index = index;
                email_dot_is_found = true;
            }
            index++;
        }
        if(email_at_index == 0 || email_dot_index == 0 || email_dot_index - email_at_index <= 1){
            setMessage(email_manual);
            return;
        }
        let email_top_level_domain = email.substring(email_dot_index + 1, email.length);
        if(email_top_level_domain.length < 2){
            setMessage(email_manual);
            return;
        }

        
        // Now we need to send the information to the backend
        const response = await fetch(window.API_URL+"register", {
            method:"POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password, email }),
          })
          .catch(API_error => {
            setError(<div>API Error: {API_error.message}</div>);
            setMessage(error);
          });
        
        if(response.ok){
            setMessage(successful_registration_message);
            window.location.href = window.mainpage_URL;
        }else{
            setError(<div><div>Registration failed:</div> <div>{response.status} {response.statusText}</div></div>);
            setMessage(error);
            console.log("messageset");
        }

    }
    // Function to prepare the login form to be rendered in the app.js
    return (
        <div className="App">
            <header className="App-header">
                <div className="content-container">
                    <img src={logo} className="App-logo" alt="logo" />
                    <div className="register-container">
                        <h1>Register</h1>
                        <h6 style={{ color: 'red' }}>{message}</h6>
                        <form onSubmit={handleSubmit} className="form-fields">
                            <div className="form-field">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <input
                                    type="password"
                                    placeholder="Password Repeat"
                                    value={password_repeat}
                                    onChange={e => setPassword_repeat(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <input
                                    type="text"
                                    placeholder="Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <a href = {window.KVKK_URL} target = "_blank">KVKK</a>
                                <input 
                                    type="checkbox"
                                    value={KVKK}
                                    onChange={e => setKVKK(e.target.value)}
                                    required
                                />
                            </div>
                            <input type="submit" value="Submit"></input>
                        </form>
                    </div>
                </div>
            </header>
        </div>
    );
}

export default Register;


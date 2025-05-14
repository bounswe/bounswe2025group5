import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';

function Login({ isLoggedIn, setIsLoggedIn, url }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate('/main');
  }, [isLoggedIn, navigate]);

  const handleSubmit = async () => {
    setError(null);
    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('isAdmin', data.isAdmin);
        localStorage.setItem('isModerator', data.isModerator);
        setIsLoggedIn(true);
        console.log("login successful here is isLoggedIn:", isLoggedIn);
      } else {
        setError(data.message || 'Login failed');
        setIsLoggedIn(false);
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center vh-100">
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
            <h3 className="mb-4">Login</h3>
            {error && <Alert variant="danger">{error}</Alert>}
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Email or Username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
            <input
              type="password"
              className="form-control mb-4"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button variant="primary" onClick={handleSubmit} className="w-100 mb-3">
              Login
            </Button>
            <div className="d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={() => navigate('/register')}>
                Register
              </Button>
              <Button variant="link" onClick={() => navigate('/')}>Home</Button>
            </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;

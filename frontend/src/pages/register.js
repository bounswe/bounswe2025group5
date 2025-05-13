import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import KVKK from './KVKK'; // Implement this modal in a separate file

function Register({ url }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    if (!kvkkAccepted) {
      setError('You must accept the KVKK!');
      return;
    }
    if (password !== passwordRepeat) {
      setError('Passwords do not match!');
      return;
    }
    const pwdRules = [/[0-9]/, /[A-Z]/, /[a-z]/, /[^0-9A-Za-z]/];
    if (password.length < 8 || !pwdRules.every((r) => r.test(password))) {
      setError('Password must be at least 8 chars, including uppercase, lowercase, number & special char');
      return;
    }
    const emailPattern = /^[^@]+@[^@]+\.[^@]{2,}$/;
    if (!emailPattern.test(email)) {
      setError('Enter a valid email address');
      return;
    }

    try {
      const response = await fetch(`${url}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center vh-100">
      <Row className="w-100">
        <Col md={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
            <h3 className="mb-4">Register</h3>
            {error && <Alert variant="danger">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}

            <input
              type="text"
              className="form-control mb-3"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Repeat Password"
              value={passwordRepeat}
              onChange={(e) => setPasswordRepeat(e.target.value)}
            />
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="form-check mb-4 text-start">
              <input
                id="kvkkCheck"
                type="checkbox"
                className="form-check-input"
                checked={kvkkAccepted}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
              />
              <label htmlFor="kvkkCheck" className="form-check-label ms-2">
                <span
                  className="text-primary"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowModal(true)}}
                >
                  I accept the KVKK
                </span>
              </label>
            </div>

            <Button variant="primary" onClick={handleSubmit} className="w-100 mb-3">
              Submit
            </Button>
            <div className="d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="link" onClick={() => navigate('/')}>Home</Button>
            </div>

            {/* KVKK Modal */}
            <KVKK show={showModal} onHide={() => setShowModal(false)} />
        </Col>
      </Row>
    </Container>
  );
}

export default Register;

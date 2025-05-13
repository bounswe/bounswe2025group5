import React, { useState } from 'react';
import { Accordion, Button, Spinner, Alert, Modal, ListGroup } from 'react-bootstrap';

export default function ChallengeCard({ challenge, onAction, url }) {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const   [showLeaderboard, setShowLeaderboard] = useState(false);
    const [lbLoading, setLbLoading] = useState(false);
    const [lbError, setLbError] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    

    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const username = localStorage.getItem('username');
    
    const {
        challengeId,
        name,
        amount,
        description,
        startDate,
        endDate,
        status,
        wasteType,
        attendee,
    } = challenge;

    const handleJoin = async (e) => {
        e.stopPropagation();
        if (status === 'Ended') {
            setError('Challenge has ended.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${url}/api/challenges/attend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, challengeId }),
            });
            if (res.ok) onAction();
            else {
                const data = await res.json();
                setError(data.message || 'Failed to join challenge.');
            }
        } catch {
            setError('Join error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = async (e) => {
        e.stopPropagation();
        if (status === 'Ended') {
            setError('Challenge has ended.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${url}/api/challenges/leave/${username}/${challengeId}`, { method: 'DELETE' });
            if (res.ok) onAction();
            else {
                const data = await res.json();
                setError(data.message || 'Failed to leave challenge.');
            }
        } catch {
            setError('Leave error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleEndChallenge = async (e) => {
        e.stopPropagation();
        if (status === 'Ended') return;
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${url}/api/challenges/end/${challengeId}`, { method: 'PUT' });
            if (res.ok) onAction();
            else {
                const data = await res.json();
                setError(data.message || 'Failed to end challenge.');
            }
        } catch {
            setError('End error occurred.');
        } finally {
            setLoading(false);
        }
    };
     // Leaderboard handlers
  const openLeaderboard = async (e) => {
    e.stopPropagation();
    setShowLeaderboard(true);
    setLbLoading(true);
    setLbError(null);
    try {
      const res = await fetch(`${url}/api/challenges/leaderboard?id=${challengeId}`);
      const data = await res.json();
      if (res.ok) {
        // sort descending by remainingAmount
        const sorted = data.sort((a, b) => b.remainingAmount - a.remainingAmount);
        setLeaderboard(sorted);
      } else {
        setLbError(data.message || 'Failed to load leaderboard.');
      }
    } catch {
      setLbError('Error loading leaderboard.');
    } finally {
      setLbLoading(false);
    }
  };

  const closeLeaderboard = () => setShowLeaderboard(false);


    return (
        <>
        <Accordion flush style={{
            maxWidth: '400px',
            flex: 'auto',
            border: '0px transparent',
            borderRadius: '0.5rem',
            overflow: 'hidden'
            }}>
            <Accordion.Item eventKey={challengeId.toString()} >
                <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100" >
                        <span className="fs-6 fw-bold text-truncate">{name}</span>
                        <small className="text-muted fs-10" style={{ fontSize: '0.7rem' }}>
                            {startDate} - {endDate}
                        </small>
                    </div>
                </Accordion.Header>
                <Accordion.Body>
                    <p className="mb-2 fs-7 text-secondary" style={{ fontSize: '1.15rem', lineHeight: '1.2' }}>
                        {description}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted fs-8" style={{ fontSize: '0.8rem' }}>
                            {wasteType}
                        </small>
                        <small className="text-muted fs-8" style={{ fontSize: '0.8rem' }}>
                            Amount: {amount}
                        </small>
                        <span className="fw-semibold fs-7" style={{ fontSize: '0.8rem' }}>{status}</span>
                    </div>

                    <div className="d-flex gap-2">
                        {loading && <Spinner animation="border" size="sm" />}
                        {!loading && attendee && status !== 'Ended' && (
                            <Button variant="danger" size="sm" onClick={handleLeave}>Leave</Button>
                        )}
                        {!loading && !attendee && status !== 'Ended' && (
                            <Button variant="primary" size="sm" onClick={handleJoin}>Join</Button>
                        )}
                        {isAdmin && status !== 'Ended' && (
                            <Button variant="warning" size="sm" onClick={handleEndChallenge}>End</Button>
                        )}
                        {!loading && (
                        <Button variant="info" size="sm" onClick={openLeaderboard}>Leaderboard</Button>
                        )}
                    </div>

                    {error && <Alert variant="danger" className="mt-2 py-1 px-2">{error}</Alert>}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
        {/* Leaderboard Modal */}
      <Modal show={showLeaderboard} onHide={closeLeaderboard} centered>
        <Modal.Header closeButton>
          <Modal.Title>Leaderboard</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lbLoading && <div className="text-center"><Spinner animation="border" /></div>}
          {lbError && <Alert variant="danger">{lbError}</Alert>}
          {!lbLoading && !lbError && (
            <ListGroup variant="flush">
              {leaderboard.map((entry, idx) => (
                <ListGroup.Item key={entry.username} className="d-flex justify-content-between">
                  <span>{idx + 1}. {entry.username}</span>
                  <span>{entry.remainingAmount}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={closeLeaderboard}>Close</Button>
        </Modal.Footer>
      </Modal>
        </>
    );
}

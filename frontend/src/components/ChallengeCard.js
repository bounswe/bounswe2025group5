import React, { useState } from 'react';
import { Accordion, Button, Spinner, Alert } from 'react-bootstrap';

export default function ChallengeCard({ challenge, onAction, url }) {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

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


    return (
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
                    </div>

                    {error && <Alert variant="danger" className="mt-2 py-1 px-2">{error}</Alert>}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}

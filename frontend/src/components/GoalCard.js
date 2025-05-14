import React, { useState } from 'react';
import { Card, ProgressBar, Button, Modal, Form } from 'react-bootstrap';

export default function GoalCard({ username, goal, onDelete, onEdit, onToggleComplete, onLogAdded , url, setError}) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [logAmount, setLogAmount] = useState('');
  const progress = goal.amount > 0 ? Math.min((goal.wasteLogged / goal.amount) * 100, 100) : 0;

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
    const res = await fetch(`${url}/api/logs/create`, {
      method: 'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ username, goalId: goal.goalId, amount: Number(logAmount) })
    });
    const data = await res.json();
    if (!res.ok) {
        setError(data.message || 'Failed to add log');
        }
    }
    catch (error) {
        console.error('Error adding log:', error);
    }
    finally {
    setShowLogModal(false);
    setLogAmount('');
    onLogAdded();
  }};

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-capitalize">{goal.wasteType}</h5>
        <div>
          <Button size="sm" variant="success" onClick={()=>setShowLogModal(true)}>Add Log</Button>{' '}
          <Button size="sm" variant="primary" onClick={()=>onEdit(goal)}>Edit</Button>{' '}
          <Button size="sm" variant="danger" onClick={()=>onDelete(goal.goalId)}>Delete</Button>
        </div>
      </Card.Header>

      <Card.Body>
        <p className="mb-1"><strong>Target:</strong> {goal.amount} {goal.unit} in {goal.duration} days</p>
        <ProgressBar now={progress} variant="warning" className="mb-2" />
        <div className="d-flex justify-content-between small text-muted">
          <span>Remaining: {(goal.amount)} {goal.unit}</span>
          <span>Waste Load: {goal.progress}%</span>
        </div>
      </Card.Body>

      <Modal show={showLogModal} onHide={()=>setShowLogModal(false)}>
        <Modal.Header closeButton><Modal.Title>Add Waste Log</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Amount</Form.Label>
            <Form.Control type="number" value={logAmount} onChange={e=>setLogAmount(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowLogModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleAddLog}>Add</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

GoalCard.defaultProps = { wasteLogged: 0 };
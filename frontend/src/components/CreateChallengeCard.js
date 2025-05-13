import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';

export default function CreateChallengeCard({ show, handleClose, onAction, url }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    startDate: '',
    endDate: '',
    wasteType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${url}/api/challenges/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onAction();
        setFormData({ name: '', description: '', amount: '', startDate: '', endDate: '', wasteType: '' });
        handleClose();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create challenge.');
      }
    } catch {
      setError('Error creating challenge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New Challenge</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleCreate}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3" controlId="challengeName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter challenge name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="challengeDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="challengeAmount">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter target amount"
              required
            />
          </Form.Group>

          <Form.Group className="row mb-3">
            <div className="col">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3" controlId="challengeWasteType">
            <Form.Label>Waste Type</Form.Label>
            <Form.Select
              name="wasteType"
              value={formData.wasteType}
              onChange={handleChange}
              required
            >
              <option value="">Select waste type</option>
              <option value="Plastic">Plastic</option>
              <option value="Organic">Organic</option>
              <option value="Paper">Paper</option>
              <option value="Metal">Metal</option>
              <option value="Glass">Glass</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="success" type="submit" disabled={loading}>
            {loading && <Spinner animation="border" size="sm" className="me-2" />}
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

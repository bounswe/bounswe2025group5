import React, { useState, useEffect } from 'react';
import GoalCard from '../components/GoalCard';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';


export default function Goal({ url }) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGoal, setNewGoal] = useState({ duration: '', unit: 'Bottles', wasteType: 'Plastic', amount: '' });
    const wasteTypes = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass'];
    const wasteUnits = ['Bottles', 'Grams', 'Kilograms', 'Liters', 'Units'];
    const username = localStorage.getItem('username');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editGoal, setEditGoal] = useState({ duration: '', unit: 'Bottles', wasteType: 'Plastic', amount: '' });

    const openEditModal = (goal) => {
        setEditGoal(goal);
        setShowEditModal(true);
        console.log('goal', goal.goalId);
    };
    const fetchGoals = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${url}/api/goals/info?username=${username}&size=10`);
            const data = await res.json();
            if (res.ok) setGoals(data.goals || data);
            else setError("Couldn't load goals");
        } catch {
            setError("Couldn't load goals");
        } finally {
            setLoading(false);
        }
        console.log(goals, 'goals fetched');
    };

    useEffect(() => { fetchGoals(); }, []);


    const handleEditSubmit = async e => {
        e.preventDefault();
        const body = {
            username,
            duration: Number(editGoal.duration),
            unit: editGoal.unit,
            wasteType: editGoal.wasteType,
            amount: Number(editGoal.amount)
        };
        const res = await fetch(`${url}/api/goals/edit/${editGoal.goalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            setShowEditModal(false);
            setEditGoal({ duration: '', unit: 'Bottles', wasteType: 'Plastic', amount: '' });
            fetchGoals();
        } else {
            setError('Failed to edit goal');
            console.log('Failed to edit goal', res);
        }
    };

    const goalCardDelete = async (goalId) => {
        try {
            const response = await fetch(`${url}/api/goals/delete/` + goalId, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Goal succesfully deleted!"); // Set the fetched goals to state
            } else {
                setError("Couldn't delete waste goals. Please try again.");
            }
        } catch (err) {
            setError("Couldn't delete waste goals. Please try again.");
        }
        fetchGoals(); // Fetch posts when component updates
    }

    const handleCreateSubmit = async e => {
        e.preventDefault();
        const body = {
            username,
            duration: Number(newGoal.duration),
            unit: newGoal.unit,
            wasteType: newGoal.wasteType,
            amount: Number(newGoal.amount)
        };
        const res = await fetch(`${url}/api/goals/create`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if (res.ok) {
            setShowCreateModal(false);
            setNewGoal({ duration: '', unit: 'Bottles', wasteType: 'Plastic', amount: '' });
            fetchGoals();
        } else {
            setError('Failed to add goal');
            console.log('Failed to add goal', res);
        }
    };

    return (
        <Container className="mt-2">
            <div className="text-center mb-5">
                <Button variant="info" onClick={() => setShowCreateModal(true)}>
                    Create Goal
                </Button>
            </div>

            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>New Waste Goal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <p className="text-danger">{error}</p>}
                    <Form onSubmit={handleCreateSubmit}>
                        <Form.Group className="mb-2">
                            <Form.Label>Duration (days)</Form.Label>
                            <Form.Control
                                type="number"
                                value={newGoal.duration}
                                onChange={e => setNewGoal(prev => ({ ...prev, duration: e.target.value }))}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Waste Unit</Form.Label>
                            <Form.Select
                                value={newGoal.unit}
                                onChange={e => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                            >
                                {wasteUnits.map(u => <option key={u}>{u}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Waste Type</Form.Label>
                            <Form.Select
                                value={newGoal.wasteType}
                                onChange={e => setNewGoal(prev => ({ ...prev, wasteType: e.target.value }))}
                            >
                                {wasteTypes.map(t => <option key={t}>{t}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control
                                type="number"
                                value={newGoal.amount}
                                onChange={e => setNewGoal(prev => ({ ...prev, amount: e.target.value }))}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary">Add Goal</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Waste Goal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <p className="text-danger">{error}</p>}
                    <Form onSubmit={handleEditSubmit}>
                        <Form.Group className="mb-2">
                            <Form.Label>Duration (days)</Form.Label>
                            <Form.Control
                                type="number"
                                value={editGoal.duration}
                                onChange={e => setEditGoal(prev => ({ ...prev, duration: e.target.value }))}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Waste Unit</Form.Label>
                            <Form.Select
                                value={editGoal.unit}
                                onChange={e => setEditGoal(prev => ({ ...prev, unit: e.target.value }))}
                            >
                                {wasteUnits.map(u => <option key={u}>{u}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Waste Type</Form.Label>
                            <Form.Select
                                value={editGoal.wasteType}
                                onChange={e => setEditGoal(prev => ({ ...prev, wasteType: e.target.value }))}
                            >
                                {wasteTypes.map(t => <option key={t}>{t}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control
                                type="number"
                                value={editGoal.amount}
                                onChange={e => setEditGoal(prev => ({ ...prev, amount: e.target.value }))}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary">Edit Goal</Button>
                    </Form>
                </Modal.Body>
            </Modal>


            <Row>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    goals.map(goal => (
                        <Col key={goal.goalId} xs={1} md={6} className="mb-4">
                            <GoalCard
                                username={username}
                                goal={goal}
                                onDelete={goalCardDelete}
                                onEdit={openEditModal}
                                onToggleComplete={fetchGoals}
                                onLogAdded={fetchGoals}
                                url={url}
                                setError={setError}
                            />
                        </Col>
                    ))
                )}
            </Row>
        </Container>
    );
}

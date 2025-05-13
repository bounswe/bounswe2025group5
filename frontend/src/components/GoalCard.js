import React, { useState } from 'react';

export default function GoalCard({url, goal, onDelete, onToggleComplete, onEdit }) {
    const [isCompleted, setIsCompleted] = useState(goal.completed === 1); // Convert `completed` to boolean
    const [isEditing, setIsEditing] = useState(false); // Track if the card is in edit mode
    const [editedGoal, setEditedGoal] = useState({ ...goal }); // Local state for editing

    const twoDigitString = (number) => {
        if (number < 10) {
            return "0" + number;
        }else{
            return "" + number;
        }
    }
    const monthLength = (month,year) => {
        if(month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
            return 31;
        }
        else if(month === 4 || month === 6 || month === 9 || month === 11) {
            return 30;
        }
        else if(month === 2 && year%4 === 0) {
            return 28;
        }else{
            return 29;
        }
    }

    const dateAdd = (date , duration) => {
        let year = Number(date.substring(0, 4));
        let month = Number(date.substring(5, 7));
        let day = Number(date.substring(8, 10));
        day += duration;
        while (day > monthLength(month,year)) {
            day -= monthLength(month,year);
            month += 1;
            if (month > 12) {
                month -= 12;
                year += 1;
            }
        }
        
        return day + "." + twoDigitString(month) + "." + year;
    }

    const handleToggleComplete = () => {
        const newStatus = !isCompleted;
        setIsCompleted(newStatus);
        onToggleComplete(goal.goalId, newStatus); // Notify parent to update backend
    };

    const handleCloseEdit = () => {
        setIsEditing(false); 
        setEditedGoal(goal);
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditedGoal((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = () => {
        onEdit(goal.goalId, editedGoal); // Notify parent to update backend
        setIsEditing(false); // Exit edit mode
    };

    return (
        <div style={styles.card}>
            <h3>{goal.wasteType} Goal</h3>
            {!isEditing ? (
                <>
                    <p><strong>Amount:</strong> {goal.amount} {goal.unit}</p>
                    <p><strong>Due Date:</strong> {dateAdd(goal.createdAt,goal.duration)}</p>
                    <p><strong>Duration:</strong> {goal.duration} days</p>
                    <p><strong>Progress:</strong> {goal.percentOfProgress}%</p> {/* The backend doesn't give this percentage  :/  */}
                    <p><strong>Status:</strong> {isCompleted ? "Completed" : "Not Completed"}</p>

                    <div style={styles.actions}>
                        <button onClick={handleToggleComplete} style={styles.button}>
                            {isCompleted ? "Mark as Not Completed" : "Mark as Completed"}
                        </button>
                        <button onClick={() => setIsEditing(true)} style={styles.button}>
                            Edit
                        </button>
                        <button onClick={() => onDelete(goal.goalId)} style={styles.button}>
                            Delete
                        </button>
                    </div>
                </>
            ) : (
                <div style={styles.editAccordion}>
                    <label>
                        Amount:
                        <input
                            type="number"
                            name="amount"
                            value={editedGoal.amount}
                            onChange={handleEditChange}
                        />
                    </label>
                    <label>
                        Unit:
                        <select
                            name="unit"
                            value={editedGoal.unit}
                            onChange={handleEditChange}
                        >
                            <option value="Bottles">Bottles</option>
                            <option value="Grams">Grams</option>
                            <option value="Kilograms">Kilograms</option>
                        </select>
                    </label>
                    <label>
                        Waste Type:
                        <select
                            name="wasteType"
                            value={editedGoal.wasteType}
                            onChange={handleEditChange}
                        >
                            <option value="Glass">Glass</option>
                            <option value="Metal">Metal</option>
                            <option value="Organic">Organic</option>
                            <option value="Plastic">Plastic</option>
                        </select>
                    </label>
                    <label>
                        Duration (days):
                        <input
                            type="number"
                            name="duration"
                            value={editedGoal.duration}
                            onChange={handleEditChange}
                        />
                    </label>
                    <div style={styles.actions}>
                        <button onClick={handleSaveEdit} style={styles.button}>
                            Save
                        </button>
                        <button onClick={handleCloseEdit} style={styles.button}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    card: {
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    actions: {
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
    },
    button: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        backgroundColor: '#007BFF',
        color: '#fff',
    },
    editAccordion: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
};
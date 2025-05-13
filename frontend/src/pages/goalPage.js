import React, { use } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//import Accordion from 'react-bootstrap/Accordion'; // Install accordion via npm install react-bootstrap bootstrap
import GoalCard from '../components/GoalCard';

function Goal({ isLoggedIn, setIsLoggedIn ,username, setUserName}) {
    // I couldn't find a way to import waste types and units from the backend, so I hardcoded them for now.
    const wasteTypes = ["Plastic", "Organic", "Paper", "Metal", "Glass"];
    const wasteUnits = ["Bottles", "Grams", "Kilograms", "Liters", "Units"];

    const [goals, setGoals] = useState([]); // State to hold the goal data
    const [lastGoalID, setLastGoalID] = useState(0); // State to hold the last goal ID
    const [loading, setLoading] = useState(true); // State to manage loading state
    const [message, setMessage] = useState('Enter your waste goal!');
    const [duration, setDuration] = useState(0);
    const [wasteUnit, setWasteUnit] = useState(wasteUnits[0]); // Default waste unit
    const [wasteType, setWasteType] = useState(wasteTypes[0]); // Default waste type
    const [amount, setAmount] = useState(0.0);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook to programmatically navigate
    const durationErrorMessage = <h6 style={{ color: 'red' }}>Duration must be a number!</h6>
    const amountErrorMessage = <h6 style={{ color: 'red' }}>Amount must be a number!</h6>
    const goalCardSetErrorMessage = <h6 style={{ color: 'red' }}>Failed to set goal!</h6>
    const goalCardShowErrorMessage = <h6 style={{ color: 'red' }}>Couldn't show the goals!</h6>
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login'); // Redirect to feed page if not logged in
        }
    }, [isLoggedIn]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        try {
            try{
                setDuration(Number(duration));
            }catch{
                setError(durationErrorMessage);
                return;
            }
    
            try{
                setAmount(Number(amount));
            }catch{
                setError(amountErrorMessage);
                return;
            }

            const response = await fetch('/api/goals/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "username" : username,
                    "unit": wasteUnit,
                    "wasteType": wasteType,
                    "duration": duration,
                    "amount": amount
                  }),
            });
            const data = await response.json();

            if (response.ok) {
                setMessage("Goal has been successfully added!"); // Set the fetched goals to state
            } else {
                setError(goalCardSetErrorMessage);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
        fetchGoals(); // Fetch posts when component updates
    };
    const fetchGoals = async () => {
        try {
            const response = await fetch("/api/goals/info?username=" + username + "&size=" + "10", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
                /* body: JSON.stringify({ 
                    "username" : username, 
                    "size" : 10, 
                    "lastGoalId" : lastGoalID}), // Adjust the size and lastGoalID as needed */
            });
            const data = await response.json();
            if (response.ok) {
                setLastGoalID(data.goalId);
                setGoals(data); // Set the fetched goals to state
            } else {
                setError(goalCardShowErrorMessage);
            }
        } catch (err) {
            setError(goalCardShowErrorMessage);
        } finally {
            //setLoading(false); // Set loading to false after fetching data
        }
    }

    useEffect(() => {
            fetchGoals(); // Fetch posts when the component mounts
    }, []);

    const goalCardDelete = async (goalId) => {
        try {
            const response = await fetch('/api/goals/delete/' + goalId, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok) {
                setMessage("Goal succesfully deleted!"); // Set the fetched goals to state
            } else {
                setError("Couldn't delete waste goals. Please try again.");
            }
        } catch (err) {
            setError("Couldn't delete waste goals. Please try again.");
        }
        fetchGoals(); // Fetch posts when component updates
    }

    const goalCardEditChange = async (goalId, editedGoal) => {
        try {
            const response = await fetch('/api/goals/edit/' + goalId,{
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "username" : username,
                    "unit": editedGoal.unit,
                    "wasteType": editedGoal.wasteType,
                    "duration": editedGoal.duration,
                    "amount": editedGoal.amount
                  }),
            })
            if (response.ok) {
                setMessage("Goal succesfully edited!");
            } else {
                setError("Couldn't edit waste goals. Please try again.");
            }
        }catch(err){
            setError("Couldn't edit waste goals. Please try again.");
        }
        fetchGoals();
    }

    const goalCardToggleComplete = async () => { // Already implemented inside goalCard component for some reason.

    }
    

    return (
        <div className="goal_log_and_view">
            <div className="goal_log">
                <h1>{message}</h1>
                <form onSubmit={handleSubmit} className="form-fields">
                {error && <p className="error">{error}</p>}

                    

                    <div className="duration-entry">
                    <span style={{ color: 'black' }}>Duration (days): </span>
                        <input
                        type="number"
                        placeholder="duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        min="0"
                        />
                    </div>
                    <div className="waste-unit-entry">        
                        <span style={{ color: 'black' }}>Waste unit: </span>
                        <select
                            name="wasteUnit"
                            value={wasteUnit}
                            onChange={(e) => setWasteUnit(e.target.value)}
                        >   
                            {wasteUnits.map((entry, index) => (
                                <option value={entry}>{entry}</option>
                            ))}
                        </select>
                    </div>
                    <div className="waste-type-entry">        
                        <span style={{ color: 'black' }}>Waste type: </span>
                        <select
                            name="wasteType"
                            value={wasteType}
                            onChange={(e) => setWasteType(e.target.value)}
                        >   
                            {wasteTypes.map((entry, index) => (
                                <option value={entry}>{entry}</option>
                            ))}
                        </select>
                    </div>
                    <div className="amount-entry">
                        <span style={{ color: 'black' }}>Amount: </span>
                        <input
                        type="number"
                        placeholder="waste type"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="0"
                        />
                    </div>
                    <button type="submit">
                        Set Goal
                    </button>
                </form>
            
            </div>
            
            <div className="goal_view">
                {
                    goals.map((goal, index) => (
                        <div>                      
                            <GoalCard goal={goal} onDelete={goalCardDelete} onToggleComplete={goalCardToggleComplete} onEdit={goalCardEditChange}/>
                        </div>
                    ))
                }
            </div>
            
        </div>
    );

}

export default Goal;
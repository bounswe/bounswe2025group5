import { useState } from "react";

export default function CreateChallengeCard({ onAction, url }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        amount: "",
        startDate: "",
        endDate: "",
        wasteType: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateChallenge = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${url}/api/challenges/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                onAction();
                setFormData({
                    name: "",
                    description: "",
                    amount: "",
                    startDate: "",
                    endDate: "",
                    wasteType: "",
                });
            } else {
                const errData = await response.json();
                setError(errData.message || "Failed to create challenge.");
            }
        } catch (error) {
            setError("Error creating challenge.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                border: "2px dashed #28a745",
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: "#f9fff9",
                marginBottom: "1rem",
            }}
        >
            <h3>Create New Challenge</h3>
            <input
                type="text"
                name="name"
                placeholder="Challenge Name"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
            />
            <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                style={styles.textarea}
            />
            <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleChange}
                style={styles.input}
            />
            <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                style={styles.input}
            />
            <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                style={styles.input}
            />
            <select
                name="wasteType"
                value={formData.wasteType}
                onChange={handleChange}
                style={styles.input}
            >
                <option value="">Select Waste Type</option>
                <option value="Plastic">Plastic</option>
                <option value="Organic">Organic</option>
                <option value="Paper">Paper</option>
                <option value="Metal">Metal</option>
                <option value="Glass">Glass</option>
            </select>


            {error && <p style={{ color: "red" }}>{error}</p>}

            <button
                onClick={handleCreateChallenge}
                disabled={loading}
                style={styles.button}
            >
                {loading ? "Creating..." : "Create Challenge"}
            </button>
        </div>
    );
}

const styles = {
    input: {
        width: "100%",
        margin: "8px 0",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    textarea: {
        width: "100%",
        margin: "8px 0",
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        resize: "vertical",
    },
    button: {
        padding: "10px 16px",
        backgroundColor: "#28a745",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        marginTop: "10px",
    },
};

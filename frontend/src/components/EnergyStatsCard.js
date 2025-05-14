import { Card, Spinner, Alert, Button } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import React, { useEffect, useState } from 'react';

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const EnergyStatsCard = ({ url }) => {
  const [countryCode, setCountryCode] = useState('WLD'); // Default to WLD
  const [stat, setStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStat = async () => {
      try {
        const res = await fetch(`${url}/api/home/energy/${countryCode}`);
        const data = await res.json();

        if (data && data.length > 0) {
          setStat(data); // Assuming an array of stats.
        } else {
          setStat([]); // Empty array for no data case.
        }
      } catch (err) {
        setError('Failed to load energy stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchStat();
  }, [countryCode, url]);

  // Prepare chart data for multiple entries
  const getChartData = () => {
    const years = stat.map((entry) => entry.year); // Array of years
    const values = stat.map((entry) => entry.value); // Array of values

    return {
      labels: years,
      datasets: [
        {
          label: 'Renewable Energy (% of final consumption)',
          data: values,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  };

  const handleButtonClick = (code) => {
    setCountryCode(code);
  };

  if (loading) {
    return <Spinner animation="border" variant="success" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Card className="shadow p-3 mb-4 bg-white rounded">
      <Card.Body>
        <Card.Title>Renewable Energy Ratio in Total Consumption</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Country: {countryCode} | Data Points: {stat.length}
        </Card.Subtitle>

        {/* Buttons for country selection */}
        <div className="mb-3">
          <Button variant="info" onClick={() => handleButtonClick('WLD')} className="me-2">
            World (WLD)
          </Button>
          <Button variant="info" onClick={() => handleButtonClick('EU')} className="me-2">
            European Union (EU)
          </Button>
          <Button variant="info" onClick={() => handleButtonClick('TR')} className="me-2">
            Turkey (TR)
          </Button>
        </div>

        {stat.length > 0 ? (
          <Line data={getChartData()} />
        ) : (
          <Alert variant="warning">No data available.</Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default EnergyStatsCard;

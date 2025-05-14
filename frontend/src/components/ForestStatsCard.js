import { Card, Spinner, Alert } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';

const ForestStatsCard = ({ url }) => {
  const [forestLoss, setForestLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForestLoss = async () => {
      try {
        const res = await fetch(`${url}/api/home/forestReduction`);
        const data = await res.json(); // Backend returns just the number

        setForestLoss(data); // e.g., 50986
      } catch (err) {
        setError('Failed to load forest loss data.');
      } finally {
        setLoading(false);
      }
    };

    fetchForestLoss();
  }, [url]);

  if (loading) {
    return <Spinner animation="border" variant="success" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Card
      className="shadow p-3 mb-4 text-white"
      style={{
        background: 'rgba(253, 253, 253, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '1rem',
      }}
    >
      <Card.Body>
        <Card.Title className='text-dark'>Global Forest Loss</Card.Title>
        <Card.Text className="text-muted fw-semibold fs-5">
          {Math.round(forestLoss)} km² of forest area was lost in 2022 – let’s stop it!
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default ForestStatsCard;

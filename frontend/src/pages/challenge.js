import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import ChallengeCard from '../components/ChallengeCard';
import CreateChallengeCard from '../components/CreateChallengeCard';
import Loader from '../components/ui/spinner';

export default function Challenge({ url }) {
  const [username] = useState(localStorage.getItem('username'));
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${url}/api/challenges?username=${username}`);
      const data = await res.json();
      if (res.ok) setChallenges(data);
      else setError(data.message || 'Failed to fetch challenges');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);



  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
    setSelectedChallengeId(null);
  };

  const handleOpenCreate = () => setShowCreate(true);
  const handleCloseCreate = () => setShowCreate(false);

  if (loading) return <Loader size="50px" message="Loading Challenges..." />;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="p-3">
      {isAdmin && (
        <>
          <Button variant="success" className="mb-3" onClick={handleOpenCreate}>
            New Challenge
          </Button>
          <CreateChallengeCard
            show={showCreate}
            handleClose={handleCloseCreate}
            onAction={fetchChallenges}
            url={url}
          />
        </>
      )}

      <h1>Challenges</h1>
      <div className="d-flex flex-wrap gap-4" style={{justifyContent: 'center'}}>
        {challenges.map((c) => (
          <ChallengeCard
            key={c.challengeId}
            challenge={c}
            onAction={fetchChallenges}
            url={url}
          />
        ))}
      </div>

      
    </div>
  );
}

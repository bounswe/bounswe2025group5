import React, { useState } from 'react';
import { Form, Button, InputGroup, Spinner, Alert } from 'react-bootstrap';

const SearchBar = ({ onSearchResults }) => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const username = localStorage.getItem('username');
  // Function to handle the search when the user presses enter or clicks the button
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/search/posts/semantic?query=${query}&username=${username}&lang=${language}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      onSearchResults(data);  // Pass the results to the parent component
    } catch (err) {
      setError('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-bar">
      <Form>
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder="Search posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}  // Handle "Enter" key press
          />
          <Button variant="primary" onClick={handleSearch} disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Search'}
          </Button>
        </InputGroup>
        {error && <Alert variant="danger">{error}</Alert>}
      </Form>
    </div>
  );
};

export default SearchBar;

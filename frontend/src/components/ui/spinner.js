import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

const Loader = ({ animation = "border", size, message }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-3">
      <Spinner animation="border" role="status" style={{ color: '#10abdb', width: size, height: size }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      {message && <div className="mt-2">{message}</div>}
    </div>
  );
};

export default Loader;

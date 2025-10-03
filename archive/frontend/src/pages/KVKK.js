import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function KVKK({ show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>KVKK Privacy Notice</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          We collect and process your personal data in accordance with the KVKK (Turkish
          Personal Data Protection Law). By accepting, you consent to our use of your data for
          account management, service improvement, and other lawful purposes as described in our
          KVKK policy.
        </p>
        <p>
          For more details on how we handle and protect your information, please review the full
          KVKK policy.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default KVKK;

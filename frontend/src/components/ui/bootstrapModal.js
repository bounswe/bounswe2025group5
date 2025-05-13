
import React from "react";
import { Modal, Button } from "react-bootstrap";

const BootstrapModal = ({ title, children, show, onHide, footer }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      {title && (
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
      )}
      <Modal.Body>{children}</Modal.Body>
      {footer && <Modal.Footer>{footer}</Modal.Footer>}
    </Modal>
  );
};

export default BootstrapModal;
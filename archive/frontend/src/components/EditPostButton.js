import React, { useState } from "react";
import BootstrapModal from "./ui/bootstrapModal";
import { Button, Form } from "react-bootstrap";

function EditPostButton({ post, onPostUpdated, url }) {
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState(post.content);
  const [photoFile, setPhotoFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("content", content);
    formData.append("username", localStorage.getItem("username"));
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    try {
      const response = await fetch(`${url}/api/posts/edit/${post.postId}`, {
        method: "PUT",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setShowModal(false);
        onPostUpdated(data);
      } else {
        console.error("Failed to update post");
      }
    } catch (err) {
      console.error("Error updating post", err);
    }
  };

  return (
    <>
      <Button variant="info" size="sm" color="10abdb" onClick={() => setShowModal(true)}>
        Edit
      </Button>

      <BootstrapModal
        title="Edit Post"
        show={showModal}
        onHide={() => setShowModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} type="submit">
              Save
            </Button>
          </>
        }
      >
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="postContent">
            <Form.Label>Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group controlId="photoFile" className="mt-3">
            <Form.Label>Replace Photo (optional)</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files[0])}
            />
          </Form.Group>
        </Form>
      </BootstrapModal>
    </>
  );
}

export default EditPostButton;

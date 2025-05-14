import React from "react";
import { Button } from "react-bootstrap";

function DeletePost({ postId, onDelete, url }) {
  const handleDelete = async () => {
    try {
      const response = await fetch(`${url}/api/posts/delete/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        onDelete(postId);
      } else {
        console.error("Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post", err);
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete}>
      Delete
    </Button>
  );
}

export default DeletePost;
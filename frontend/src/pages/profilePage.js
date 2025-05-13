import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Image,
  Spinner,
  Alert
} from 'react-bootstrap';
import PostCard from "../components/PostCard";

export default function ProfilePage({ setIsLoggedIn, username, url }) {
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState({ username: "", biography: "", profilePicture: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedUser, setEditedUser] = useState({ username: "", biography: "", profilePicture: "" });
  const [photoFile, setPhotoFile] = useState(null);

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);

  const isLoggedIn = Boolean(username);

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      const usernameToFetch = localStorage.getItem("username");
      try {
        const res = await fetch(`${url}/api/profile/info?username=${usernameToFetch}`);
        const data = await res.json();
        if (res.ok) {
            console.log('user successfully fetched:', data);
          setUser(data);
          setEditedUser({ username: data.username, biography: data.biography, profilePicture: data.photoUrl });
          setMessage(data.message || "User fetched successfully.");
        } else {
          setError(data.message || "Failed to fetch user");
        }
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [url]);

  // Fetch posts for this user
  const fetchPosts = async () => {
    setPostsLoading(true);
    setPostsError(null);
    const usernameToFetch = localStorage.getItem("username");
    try {
      const res = await fetch(`${url}/api/posts/getPostsForUser?username=${usernameToFetch}`);
      const data = await res.json();
      if (res.ok) {
        setPosts(data);
      } else {
        setPostsError(data.message || "Failed to fetch posts.");
      }
    } catch {
      setPostsError("An error occurred while fetching posts.");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (user.username) fetchPosts();
  }, [user.username]);

  // Handle form input change
  const handleInputChange = e => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  // Handle file selection
  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) setPhotoFile(file);
  };

  // Save profile changes (multipart)
  const handleSaveChanges = async () => {
    const formData = new FormData();
    if (photoFile) {
        formData.append("file", photoFile)
        try {
      const res = await fetch(`${url}/api/profile/${username}/photo`, {
        method: "POST",
        body: formData
      });
        if (res.ok) {
            const data = await res.json();
            setEditedUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
            setMessage(data.message || "Profile picture updated successfully.");
        } else {
            const data = await res.json();
            setError(data.message || "Failed to update profile picture.");
        }

    } catch {
      setError("An error occurred while uploading the image.");
    }
};

    try {
      const res = await fetch(`${url}/api/profile/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editedUser.username,
          biography: editedUser.biography
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setMessage(data.message || "Profile updated successfully.");
        fetchPosts();
      } else {
        setError(data.message || "Failed to update profile.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsModalOpen(false);
      setPhotoFile(null);
    }
  };

  return (
    <Container className="py-4" style={{ marginTop: "120px" }}>
      <Row className="justify-content-between align-items-center mb-4">
        <Col><h1>Profile Page</h1></Col>
      </Row>

      {loading ? (
        <div className="text-center my-5"><Spinner animation="border" /></div>
      ) : error ? (
        <Alert variant="danger">Error: {error}</Alert>
      ) : (
        <Card className="mx-auto mb-5" style={{ maxWidth: '400px' }}>
          <Card.Body className="text-center">
            <Image src={user.photoUrl} roundedCircle width={150} height={150} className="mb-3" />
            <Card.Title>{user.username}</Card.Title>
            <Card.Text>{user.biography}</Card.Text>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>Edit Profile</Button>
          </Card.Body>
        </Card>
      )}

      {/* Posts Section */}
      <h3>Posts by {user.username}</h3>
      {postsLoading ? (
        <div className="text-center my-4"><Spinner animation="border" /></div>
      ) : postsError ? (
        <Alert variant="warning">{postsError}</Alert>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.postId}
            post={post}
            isLoggedIn={isLoggedIn}
            onAction={fetchPosts}
            url={url}
          />
        ))
      )}

      {/* Edit Profile Modal */}
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={editedUser.username}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="formBiography" className="mb-3">
              <Form.Label>Biography</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="biography"
                value={editedUser.biography}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="formProfilePicture" className="mb-3">
              <Form.Label>Profile Picture</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

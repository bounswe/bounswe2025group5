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
import LogoutButton from "../components/LogoutButton";
import PostCard from "../components/PostCard";

const ProfilePage = ({ setIsLoggedIn, username, url }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ username: "", biography: "", profilePicture: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedUser, setEditedUser] = useState({ username: "", biography: "", profilePicture: "" });
  

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
          setUser(data);
          setEditedUser({ username: data.username, biography: data.biography, profilePicture: data.profilePicture });
          setMessage(data.message || "User fetched successfully.");
        } else {
          setError(data.message || "Failed to fetch user");
        }
      } catch (err) {
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
    } catch (err) {
      setPostsError("An error occurred while fetching posts.");
    } finally {
      setPostsLoading(false);
    }
  };

  // Trigger posts fetch when user is loaded
  useEffect(() => {
    if (user.username) {
      fetchPosts();
    }
  }, [user.username]);

  const handleSaveChanges = async () => {
    try {
      const res = await fetch(`${url}/api/profile/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editedUser.username,
          biography: editedUser.biography,
          photoUrl: editedUser.profilePicture
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(editedUser);
        setMessage(data.message || "Profile updated successfully.");
        fetchPosts(); // refresh posts if username changed
      } else {
        setError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setEditedUser(prev => ({ ...prev, profilePicture: reader.result }));
      reader.readAsDataURL(file);
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
            <Image src={user.profilePicture} roundedCircle width={150} height={150} className="mb-3" />
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
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" name="username" value={editedUser.username} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBiography">
              <Form.Label>Biography</Form.Label>
              <Form.Control as="textarea" rows={3} name="biography" value={editedUser.biography} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formProfilePicture">
              <Form.Label>Profile Picture</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleImageUpload} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default ProfilePage;

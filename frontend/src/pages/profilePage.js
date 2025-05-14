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
  Alert,
  Accordion
} from 'react-bootstrap';
import PostCard from "../components/PostCard";

export default function ProfilePage({ setIsLoggedIn, username, url }) {
  const navigate = useNavigate();
  const [viewSaved, setViewSaved] = useState(false);
  const [viewPosts, setViewPosts] = useState(false);

  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(true);
  const [savedPostsError, setSavedPostsError] = useState(null);

  const [user, setUser] = useState({ username: "", biography: "", profilePicture: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedUser, setEditedUser] = useState({ username: "", biography: "", profilePicture: "" });
  const [photoFile, setPhotoFile] = useState(null);

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [badges, setBadges] = useState([]);
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

  const fetchSavedPosts = async () => {
    setSavedPostsLoading(true);
    setSavedPostsError(null);
    const usernameToFetch = localStorage.getItem("username");

    try {
      const res = await fetch(`${url}/api/posts/getSavedPosts?username=${usernameToFetch}`);
      const data = await res.json();
      if (res.ok) {
        setSavedPosts(data);
      } else {
        setSavedPostsError(data.message || "Failed to fetch saved posts.");
      }
    } catch {
      setSavedPostsError("An error occurred while fetching saved posts.");
    } finally {
      setSavedPostsLoading(false);
    }
  };
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
    if (user.username) {
      fetchPosts();
      fetchSavedPosts();
      handleBadges();
    }
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
  // handle badges using a call to api/profile/badges
  const handleBadges = async () => {
    try {
      const res = await fetch(`${url}/api/profile/badges?username=${username}`);
      const data = await res.json();
      if (res.ok) {
        setBadges(data);
      } else {
        setError(data.message || "Failed to fetch badges.");
      }
    } catch {
      setError("An error occurred while fetching badges.");
    }
  }


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
            <Button variant="info" onClick={() => setIsModalOpen(true)}>Edit Profile</Button>
          </Card.Body>

          <Accordion defaultActiveKey="1" className="px-3 pb-3">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Badges</Accordion.Header>
              <Accordion.Body>
                {badges.filter(b => b.username === user.username).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {badges
                      .filter(b => b.username === user.username)
                      .map((badge, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: 'rgb(221, 122, 9)',
                            color: 'white',
                            padding: '11px 12px',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                          }}
                        >
                          {badge.badgeName}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem' }}>No badges yet.</div>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card>
      )}

      {/* Posts Section */}

      <div className="d-flex justify-content-center mb-4">
        <Button
          variant={viewSaved ? "outline-primary" : "primary"}
          onClick={() => { setViewPosts(true); setViewSaved(false); }}
          className="me-2"
        >
          My Posts
        </Button>
        <Button
          variant={viewSaved ? "primary" : "outline-primary"}
          onClick={() => {setViewSaved(true) ; setViewPosts(false)}}
        >
          Saved Posts
        </Button>
      </div>

      {viewPosts && (
        <>
          <h3>Posts by {user.username}</h3>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>  {/* Container with max-width */}
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
          </div>
        </>
      )}

      {viewSaved && (<>
      <h3>Saved Posts</h3>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {savedPostsLoading ? (
            <div className="text-center my-4"><Spinner animation="border" /></div>
          ) : savedPostsError ? (
            <Alert variant="warning">{savedPostsError}</Alert>
          ) : (
            savedPosts.map(post => (
              <PostCard
                key={post.postId}
                post={post}
                isLoggedIn={isLoggedIn}
                onAction={fetchSavedPosts}
                url={url}
              />
            ))
          )}
        </div></>)}


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

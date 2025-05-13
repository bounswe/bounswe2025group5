import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import PostCard from "../components/PostCard.js";
import LogoutButton from "../components/LogoutButton.js";
import { useNavigate } from "react-router-dom";
import CreatePostButton from "../components/CreatePostButton.js";
import Loader from "../components/ui/spinner.js";

function Feed({ isLoggedIn, setIsLoggedIn, url }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [lastPostId, setLastPostId] = useState(null);
  const fetchSize = 10;

  const fetchPosts = async () => {
    const username = localStorage.getItem("username");
    const endpoint = lastPostId
      ? `${url}/api/posts/info?size=${fetchSize}&lastPostId=${lastPostId}&username=${username}`
      : `${url}/api/posts/info?size=${fetchSize}&username=${username}`;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        if (data.length > 0) {
          setPosts(prev => [...prev, ...data]);
          setLastPostId(data[data.length - 1].postId); // <- track last post ID
          if (data.length < fetchSize) {
            setHasMorePosts(false); // No more posts
          }
        } else {
          setHasMorePosts(false);
        }
      } else {
        setError(data.message || "Failed to fetch posts.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLoadMore = () => {
    fetchPosts();
  };

  if (loading && posts.length === 0) {
    return <Loader size="50px" message="Loading posts..." />;
  }

  if (error) {
    return <div className="text-danger">Error: {error}</div>;
  }

  return (
    <Container>
      <h1 className="my-4">Post Feed</h1>

      {isLoggedIn && (
        <CreatePostButton
          onPostCreated={() => {
            setPosts([]);
            setLastPostId(null);
            setHasMorePosts(true);
            setLoading(true);
            fetchPosts();
          }}
          url={url}
        />
      )}

      <Row className="g-4 mt-3">
        {posts.map((post) => (
          <Col key={post.postId} xs={12} md={6} lg={6}>
            <PostCard post={post} isLoggedIn={isLoggedIn} onAction={fetchPosts} url={url} />
          </Col>
        ))}
      </Row>

      {hasMorePosts && (
        <div className="text-center my-4 ">
          <Button onClick={handleLoadMore} className="btn btn-info">Load More</Button>
        </div>
      )}

      {isLoggedIn && (
        <div className="mt-4 btn btn-info">
          <LogoutButton setIsLoggedIn={setIsLoggedIn} onLogout={() => navigate("/")} />
        </div>
      )}
    </Container>
  );
}

export default Feed;
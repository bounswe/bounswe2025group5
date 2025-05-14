import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import PostCard from "../components/PostCard.js";
import LogoutButton from "../components/LogoutButton.js";
import { useNavigate } from "react-router-dom";
import CreatePostButton from "../components/CreatePostButton.js";
import Loader from "../components/ui/spinner.js";
import SearchBar from "../components/searchBar.js";  // Import the SearchBar component

function Feed({ isLoggedIn, setIsLoggedIn, url }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [lastPostId, setLastPostId] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchResults, setSearchResults] = useState([]);  // State to hold search results
  const [isSearchActive, setIsSearchActive] = useState(false);  // To track whether search results are active
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchSize = 10;

  // Function to fetch posts (with or without search query)
  const fetchPosts = async (query) => {
    // take username from local storage and if its null put empty string
    const username = localStorage.getItem("username") || "";

    let endpoint;
    if (username) {
      if (loadingMore) {
        endpoint = `${url}/api/posts/info?size=${fetchSize}&lastPostId=${lastPostId}&username=${username}&query=${query}`;
      } else {
        endpoint = `${url}/api/posts/info?size=${fetchSize}&username=${username}&query=${query}`;
      }
    } else {
      if (loadingMore) {
        endpoint = `${url}/api/posts/info?size=${fetchSize}&lastPostId=${lastPostId}&query=${query}`;
      } else {
        endpoint = `${url}/api/posts/info?size=${fetchSize}&query=${query}`;
      }
    }
    setLoadingMore(false);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      if (response.ok) {
        if (data.length > 0) {
          setPosts((prev) => {
            const existingIds = new Set(prev.map(p => p.postId));
            const newPosts = data.filter(post => !existingIds.has(post.postId));
            return [...prev, ...newPosts];
          });

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
  // Search handler that updates the posts based on search query
  const handleSearchResults = (results) => {
    if (results && results.length > 0) {
      setSearchResults(results); // Store search results separately
      setIsSearchActive(true); // Activate search mode
      setHasMorePosts(false); // Since we're displaying only search results, disable "load more"
    } else {
      setSearchResults([]); // Clear search results if no matches
      setIsSearchActive(false); // Deactivate search mode
      setHasMorePosts(true); // Re-enable "load more" for regular posts
    }
  };
  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((post) => post.postId !== postId));
  }
  const handleEdit = (newPost) => {
    setPosts((prev) => prev.map((p) => (p.postId === newPost.postId ? newPost : p)));
  }
  const handleCreate = (newPost) => {
    // Add the new post to the beginning of the posts array
    setPosts((prev) => [newPost, ...prev]);
  };

  // Initial fetch on page load
  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, []);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchPosts();
  };

  // Go back to regular feed
  const goBackToFeed = () => {
    setIsSearchActive(false);
    setSearchResults([]);
    fetchPosts();
  };

  if (loading && posts.length === 0) {
    return <Loader size="50px" message="Loading posts..." />;
  }

  if (error) {
    return <div className="text-danger">Error: {error}</div>;
  }

  return (
    <Container style={{ marginTop: "70px" }}>
      <h1 className="my-4">Post Feed</h1>
      {/* Search bar */}
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <SearchBar onSearchResults={handleSearchResults} url={url} />
      </div>

      {/* Back to feed button when search is active */}
      {isSearchActive && (
        <div className="text-center my-3">
          <Button className="btn btn-secondary" onClick={goBackToFeed}>
            Back to Feed
          </Button>
        </div>
      )}

      {isLoggedIn ? (
        <div className="text-center">
          <Button
            className="btn btn-info"
            onClick={() => {
              setShowCreatePost(!showCreatePost);
            }}
          >
            {showCreatePost ? <i className="bi bi-chevron-up"></i> : "Create Post"}
          </Button>
        </div>
      )
        : <Button
          className="btn btn-info"
          onClick={() => {
            setIsLoggedIn(false);
            navigate("/");
          }}
        >
          Home
        </Button>
      }
      {isLoggedIn && showCreatePost && (
        <CreatePostButton
          onPostCreated={handleCreate}
          url={url}
        />
      )}

      <Row className="g-4 mt-3">
        {isSearchActive ? (
          searchResults.length > 0 ? (
            searchResults.map((post) => (
              <Col key={post.postId} xs={12} md={6} lg={6}>
                <PostCard post={post} isLoggedIn={isLoggedIn} onAction={fetchPosts} url={url} />
              </Col>
            ))
          ) : (
            <Col>
              <p>No posts found.</p>
            </Col>
          )
        ) : (
          posts.length > 0 ? (
            posts.map((post) => (
              <Col key={post.postId} xs={12} md={6} lg={6}>
                <PostCard post={post} isLoggedIn={isLoggedIn} onEdit={handleEdit} onDelete={handleDelete} url={url} />
              </Col>
            ))
          ) : (
            <Col>
              <p>No posts found.</p>
            </Col>
          )
        )}
      </Row>

      {hasMorePosts && !isSearchActive && (
        <div className="text-center my-4 ">
          <Button onClick={handleLoadMore} className="btn btn-info">Load More</Button>
        </div>
      )}
    </Container>
  );
}

export default Feed;

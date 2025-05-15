import React, { useState } from "react";
import { Card, Accordion } from "react-bootstrap";
import LikeButton from "./LikeButton.js";
import SaveButton from "./SaveButton.js";
import CommentSection from "./comment/index.js";
import EditPostButton from "./EditPostButton.js";
import DeletePost from "./DeletePost.js";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function PostCard({ post, isLoggedIn, onEdit, onDelete, url }) {
  const [comments, setComments] = useState(post.comments || []);
  const isOwner = isLoggedIn && post.creatorUsername === localStorage.getItem("username");
  const location = useLocation();
  const [postLiked, setPostLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(true);

  const fetchUserLikes = async () => {
    const username = localStorage.getItem("username") || "";
    try {
      const response = await fetch(`${url}/api/posts/${post.postId}/likes`);
      const data = await response.json();
      if (response.ok) {
        for (let i = 0; i < data.likedByUsers.length; i++) {
          if (username == data.likedByUsers[i].username) {
            setPostLiked(true);
            break;
          }
        }
      } else {
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    } finally {
      setLikeLoading(false);
    }
  };
  useEffect(() => {
    if (location.pathname === '/profile') {
      fetchUserLikes();
    }
  }, []);

  return (
    <Card className="mb-4 shadow rounded-4">
      {post.photoUrl && (
        <Card.Img
          variant="top"
          src={post.photoUrl}
          alt="Post"
          className="rounded-4" // Apply rounded class to the image
        />
      )}

      <Card.Body>
        {/* Content Box */}
        {location.pathname === '/feed' ? <div className="p-4 rounded bg-light mb-3 rounded-4 w-100" style={{ fontSize: '1.25rem', width: "15%" }}>
          {post.content}
        </div> : <div className="p-2 rounded bg-light mb-5 rounded-4 w-100" style={{ width: "15%", fontSize: '1.1rem' }}>
          {post.content}
        </div>}

        {/* Username and Post Info Row */}
        <div className="d-flex justify-content-between">
          <div>
            <h5 className="fw-semibold" style={{ fontSize: '1.1rem' }}>@{post.creatorUsername}</h5>
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            {!isLoggedIn && <div>Likes: {post.likes}</div>}
            {post.savedAt ? (<div style={{ fontSize: '0.7rem' }}>Saved on: {new Date(post.savedAt).toLocaleString()}</div>) : (<div style={{ fontSize: '0.7rem' }}>Posted on: {new Date(post.createdAt).toLocaleString()}</div>)}
          </div>
        </div>

        {/* Action Buttons Row for Logged-in User and Post Owner */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          {isLoggedIn && (
            <div className="d-flex gap-2">
              {(!likeLoading || location.pathname !== "/profile") && (
                <LikeButton
                  postId={post.postId}
                  liked={post.liked || postLiked}
                  likes={post.likes || post.likeCount}
                  url={url}
                />
              )}
              <SaveButton
                postId={post.postId}
                saved={post.saved || Boolean(post.savedAt)}
                url={url}
              />
            </div>
          )}


          {isOwner && (
            <div className="d-flex gap-2">
              <EditPostButton post={post} onPostUpdated={onEdit} url={url} />
              <DeletePost postId={post.postId} onDelete={onDelete} url={url} />
            </div>
          )}
        </div>

        {/* Accordion for Comments */}
        {location.pathname == '/main' && post.photoUrl != null ? null : <Accordion>
          <Accordion.Item eventKey="0">
            <Accordion.Header>Comments ({(comments > 0) ? comments : 0})</Accordion.Header>
            <Accordion.Body>
              <CommentSection
                postId={post.postId}
                comments={comments}
                setComments={setComments}
                isLoggedIn={isLoggedIn}
                url={url}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>}
      </Card.Body>
    </Card>
  );
}

export default PostCard;

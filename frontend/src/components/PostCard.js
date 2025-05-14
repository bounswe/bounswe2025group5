import React, { useState } from "react";
import { Card, Accordion } from "react-bootstrap";
import LikeButton from "./LikeButton.js";
import SaveButton from "./SaveButton.js";
import CommentSection from "./comment/index.js";
import EditPostButton from "./EditPostButton.js";
import DeletePost from "./DeletePost.js";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function PostCard({ post, isLoggedIn, onAction, url }) {
  const [comments, setComments] = useState(post.comments || []);
  const isOwner = isLoggedIn && post.creatorUsername === localStorage.getItem("username");
  const location = useLocation();

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
        {location.pathname==='/feed' ? <div className="p-5 rounded bg-light mb-3 rounded-4 w-100" style={{ width: "15%" }}>
          {post.content}
        </div> : <div className="p-2 rounded bg-light mb-5 rounded-4 w-100" style={{ width: "15%", fontSize:'1.1rem' }}>
          {post.content}
        </div>}

        {/* Username and Post Info Row */}
        <div className="d-flex justify-content-between">
          <div>
            <h5 className="fw-semibold" style={{fontSize:'1.1rem'}}>@{post.creatorUsername}</h5>
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            {!isLoggedIn && <div>Likes: {post.likes}</div>}
            <div style={{fontSize:'0.7rem'}}>Posted on: {new Date(post.createdAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Action Buttons Row for Logged-in User and Post Owner */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          {isLoggedIn && (
            <div className="d-flex gap-2">
              <LikeButton
                postId={post.postId}
                onLike={onAction}
                liked={post.liked}
                likes={post.likes}
                url={url}
              />
              <SaveButton
                postId={post.postId}
                onSave={onAction}
                saved={post.saved}
                url={url}
              />
            </div>
          )}

          {isOwner && (
            <div className="d-flex gap-2">
              <EditPostButton post={post} onPostUpdated={onAction} url={url} />
              <DeletePost postId={post.postId} onDelete={onAction} url={url} />
            </div>
          )}
        </div>

        {/* Accordion for Comments */}
        {location.pathname == '/main' && post.photoUrl != null  ?  null : <Accordion>
          <Accordion.Item eventKey="0">
            <Accordion.Header>Comments ({(comments > 0) ?  comments:0 })</Accordion.Header>
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
        </Accordion> }
      </Card.Body>
    </Card>
  );
}

export default PostCard;

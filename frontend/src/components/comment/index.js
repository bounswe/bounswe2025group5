import React from "react";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

function CommentSection({ postId, comments, setComments }) {
    return (
        <div style={{ marginTop: "1rem" }}>
            <h4>Comments</h4>
            <CommentList comments={comments} />
            <CommentInput postId={postId} setComments={setComments} />
        </div>
    );
}

export default CommentSection;
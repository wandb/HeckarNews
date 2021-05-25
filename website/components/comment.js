import { useState } from "react";
import Link from "next/link";

import renderPointsString from "../utils/renderPointsString.js";
import renderCreatedTime from "../utils/renderCreatedTime.js";
import truncateItemTitle from "../utils/truncateItemTitle.js";

import addNewComment from "../api/comments/addNewComment.js";
import upvoteComment from "../api/comments/upvoteComment.js";
import downvoteComment from "../api/comments/downvoteComment.js";

export default function CommentComponent({
    comment,
    currUsername,
    showFavoriteOption,
    goToString,
    userSignedIn,
    showDownvote,
}) {
    const [replyInputValue, setReplyInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [numOfVote, setNumOfVote] = useState(comment.points);
    const [error, setError] = useState({
        replyTextRequiredError: false,
        replyTextTooLongError: false,
        replySubmitError: false,
    });

    const updateReplyInputValue = (event) => {
        setReplyInputValue(event.target.value);
    };

    const requestSubmitReply = () => {
        if (loading) return;

        if (!userSignedIn) {
            window.location.href = `/login?goto=${encodeURIComponent(goToString)}`;
        } else if (!replyInputValue) {
            setError({
                replyTextRequiredError: true,
                replyTextTooLongError: false,
                replySubmitError: false,
            });
        } else if (replyInputValue.length > 5000) {
            setError({
                replyTextRequiredError: false,
                replyTextTooLongError: true,
                replySubmitError: false,
            });
        } else {
            setLoading(true);

            const commentData = {
                parentItemId: comment.parentItemId,
                isParent: false,
                parentCommentId: comment.id,
                text: replyInputValue,
            };

            addNewComment(commentData, (response) => {
                setLoading(false);
                if (response.authError) {
                    window.location.href = `/login?goto=${encodeURIComponent(goToString)}`;
                } else if (response.textRequiredError) {
                    setError({
                        replyTextRequiredError: true,
                        replyTextTooLongError: false,
                        replySubmitError: false,
                    });
                } else if (response.textTooLongError) {
                    setError({
                        replyTextRequiredError: false,
                        replyTextTooLongError: true,
                        replySubmitError: false,
                    });
                } else if (response.submitError || !response.success) {
                    setError({
                        replyTextRequiredError: false,
                        replyTextTooLongError: false,
                        replySubmitError: true,
                    });
                } else {
                    window.location.href = `/comment?id=${comment.id}`;
                }
            });
        }
    };

    const requestUpvoteComment = () => {
        if (loading) return;

        if (!userSignedIn) {
            window.location.href = `/login?goto=${encodeURIComponent(goToString)}`;
        } else {
            setLoading(true);

            comment.votedOnByUser = true;

            upvoteComment(comment.id, comment.parentItemId, (response) => {
                if (response.authError) {
                    window.location.href = `/login?goto=${encodeURIComponent(goToString)}`;
                } else {
                    setNumOfVote(numOfVote + 1);
                    setLoading(false);
                }
            });
        }
    };

    const requestDownvoteComment = () => {
        if (loading) return;

        if (!userSignedIn) {
            window.location.href = `/login?goto=${encodeURIComponent(goToString)}`;
        } else {
            setLoading(true);

            comment.votedOnByUser = true;

            downvoteComment(comment.id, comment.parentItemId, (response) => {
                if (response.authError) {
                    window.location.href = `/login?goto=${encodeURIComponent(goToString)}`;
                } else {
                    setNumOfVote(numOfVote - 1);
                    setLoading(false);
                }
            });
        }
    };

    return (
        <div className="comment-content">
            <table>
                <tbody>
                    <tr>
                        <td valign="top">
                            {comment.by === currUsername ? (
                                <div className="comment-content-star">
                                    <span>*</span>
                                </div>
                            ) : null}
                            {comment.by !== currUsername ? (
                                <>
                                    {/* COMMENT UPVOTE BUTTON */}
                                    {comment.votedOnByUser || comment.dead ? (
                                        <>
                                            <div className="comment-content-upvote hide">
                                                <span></span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div
                                                className="comment-content-upvote"
                                                onClick={() => requestUpvoteComment()}>
                                                <span></span>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : null}
                            {comment.by !== currUsername ? (
                                <>
                                    {/* COMMENT DOWNVOTE BUTTON */}
                                    {comment.votedOnByUser || comment.dead || !showDownvote ? (
                                        <>
                                            <div className="comment-content-downvote hide">
                                                <span></span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div
                                                className="comment-content-downvote"
                                                onClick={() => requestDownvoteComment()}>
                                                <span></span>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : null}
                        </td>
                        <td>
                            {/* COMMENT DETAILS */}
                            <div className="comment-content-details">
                                {/* {currUsername === comment.by ? ( */}
                                {/*     <span> */}
                                {/*         {comment.points.toLocaleString()} {renderPointsString(comment.points)} by&nbsp; */}
                                {/*     </span> */}
                                {/* ) : null} */}
                                {/* AUTHOR OF COMMENT */}
                                <span className="comment-content-author">
                                    <span>
                                        {comment.points.toLocaleString()} {renderPointsString(comment.points)} by&nbsp;
                                    </span>
                                    <Link href={`/user?id=${comment.by}`}>{comment.by}</Link>
                                </span>

                                {/* COMMENT TIME CREATED */}
                                <span className="comment-content-time">
                                    <Link href={`/comment?id=${comment.id}`}>{renderCreatedTime(comment.created)}</Link>
                                </span>
                                {comment.dead ? <span className="comment-content-dead"> [dead]</span> : null}

                                {/* UNVOTE COMMENT? */}
                                {comment.votedOnByUser && !comment.unvoteExpired && !comment.dead ? (
                                    <>
                                        <span> | </span>
                                        <span className="comment-content-unvote">un-vote</span>
                                    </>
                                ) : null}
                                <span> | </span>

                                {/* PARENT OF COMMENT */}
                                <span className="comment-content-parent">
                                    <Link
                                        href={
                                            comment.isParent
                                                ? `/item?id=${comment.parentItemId}`
                                                : `/comment?id=${comment.parentCommentId}`
                                        }>
                                        parent
                                    </Link>
                                </span>

                                {/* FAVORITE THIS COMMENT? */}
                                {showFavoriteOption ? (
                                    <>
                                        {comment.favoritedByUser ? (
                                            <>
                                                <span> | </span>
                                                <span className="comment-content-favorite">un-favorite</span>
                                            </>
                                        ) : (
                                            <>
                                                <span> | </span>
                                                <span className="comment-content-favorite">favorite</span>
                                            </>
                                        )}
                                    </>
                                ) : null}

                                {/* EDIT COMMENT */}
                                {comment.by === currUsername && !comment.editAndDeleteExpired && !comment.dead ? (
                                    <>
                                        <span> | </span>
                                        <span>
                                            <Link href={`/edit-comment?id=${comment.id}`}>edit</Link>
                                        </span>
                                    </>
                                ) : null}

                                {/* DELETE COMMENT */}
                                {comment.by === currUsername && !comment.editAndDeleteExpired && !comment.dead ? (
                                    <>
                                        <span> | </span>
                                        <span>
                                            <Link
                                                href={`/delete-comment?id=${comment.id}&goto=${encodeURIComponent(
                                                    goToString
                                                )}`}>
                                                delete
                                            </Link>
                                        </span>
                                    </>
                                ) : null}
                                <span> | </span>

                                {/* COMMENT BASED ON POST TITLE */}
                                <span>
                                    on:&nbsp;
                                    <Link href={`/item?id=${comment.parentItemId}`}>
                                        {truncateItemTitle(comment.parentItemTitle)}
                                    </Link>
                                </span>
                            </div>

                            {/* COMMENT CONTENT/TEXT */}
                            <div className="comment-content-text">
                                <span dangerouslySetInnerHTML={{ __html: comment.text }}></span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            {!comment.dead ? (
                <>
                    <div className="comment-content-repy-box">
                        <textarea type="text" value={replyInputValue} onChange={updateReplyInputValue} />
                    </div>
                    <div className="comment-content-reply-btn">
                        <input type="submit" value="reply" onClick={() => requestSubmitReply()} />
                        {loading && <span> loading...</span>}
                    </div>
                    {error.replyTextRequiredError ? (
                        <div className="comment-content-reply-error-msg">
                            <span>Text is required.</span>
                        </div>
                    ) : null}
                    {error.replyTextTooLongError ? (
                        <div className="comment-content-reply-error-msg">
                            <span>Text exceeds limit of 5,000 characters.</span>
                        </div>
                    ) : null}
                    {error.replySubmitError ? (
                        <div className="comment-content-reply-error-msg">
                            <span>An error occurred.</span>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}

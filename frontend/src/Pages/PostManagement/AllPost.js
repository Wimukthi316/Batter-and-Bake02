import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoSend } from "react-icons/io5";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { BiSolidLike } from "react-icons/bi";
import Modal from 'react-modal';
import NavBar from '../../Components/NavBar/NavBar';
import { IoIosCreate } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { GrUpdate } from "react-icons/gr";
import { FiSave } from "react-icons/fi";
import { TbPencilCancel } from "react-icons/tb";
import { FaCommentAlt } from "react-icons/fa";
import './AllPostModern.css'; // We'll create this CSS file
Modal.setAppElement('#root');

function AllPost() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [postOwners, setPostOwners] = useState({});
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [editingComment, setEditingComment] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const loggedInUserID = localStorage.getItem('userID');
// Assuming userID is stored in localStorage after login
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:8080/posts');
        setPosts(response.data);
        setFilteredPosts(response.data);

        const userIDs = [...new Set(response.data.map((post) => post.userID))];
        const ownerPromises = userIDs.map((userID) =>
          axios.get(`http://localhost:8080/user/${userID}`)
            .then((res) => ({
              userID,
              fullName: res.data.fullname,
            }))
            .catch((error) => {
              if (error.response && error.response.status === 404) {
                console.warn(`User with ID ${userID} not found. Removing their posts.`);
                setPosts((prevPosts) => prevPosts.filter((post) => post.userID !== userID));
                setFilteredPosts((prevFilteredPosts) => prevFilteredPosts.filter((post) => post.userID !== userID));
              } else {
                console.error(`Error fetching user details for userID ${userID}:`, error);
              }
              return { userID, fullName: 'Anonymous' };
            })
        );
        const owners = await Promise.all(ownerPromises);
        const ownerMap = owners.reduce((acc, owner) => {
          acc[owner.userID] = owner.fullName;
          return acc;
        }, {});
        setPostOwners(ownerMap);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
// Fetch posts and user details on component mount
    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      const userID = localStorage.getItem('userID');
      if (userID) {
        try {
          const response = await axios.get(`http://localhost:8080/user/${userID}/followedUsers`);
          setFollowedUsers(response.data);
        } catch (error) {
          console.error('Error fetching followed users:', error);
        }
      }
    };

    fetchFollowedUsers();
  }, []);

  const handleDelete = async (postId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/posts/${postId}`);
      alert('Post deleted successfully!');
      setPosts(posts.filter((post) => post.id !== postId));
      setFilteredPosts(filteredPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post.');
    }
  };

  const handleUpdate = (postId) => {
    navigate(`/updatePost/${postId}`);
  };

  const handleMyPostsToggle = () => {
    if (showMyPosts) {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter((post) => post.userID === loggedInUserID));
    }
    setShowMyPosts(!showMyPosts);
  };

  const handleLike = async (postId) => {
    const userID = localStorage.getItem('userID');
    if (!userID) {
      alert('Please log in to like a post.');
      return;
    }
    try {
      const response = await axios.put(`http://localhost:8080/posts/${postId}/like`, null, {
        params: { userID },
      });

      // Update posts state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: response.data.likes } : post
        )
      );

      // Update filtered posts state
      setFilteredPosts((prevFilteredPosts) =>
        prevFilteredPosts.map((post) =>
          post.id === postId ? { ...post, likes: response.data.likes } : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleFollowToggle = async (postOwnerID) => {
    const userID = localStorage.getItem('userID');
    if (!userID) {
      alert('Please log in to follow/unfollow users.');
      return;
    }
    try {
      if (followedUsers.includes(postOwnerID)) {
        await axios.put(`http://localhost:8080/user/${userID}/unfollow`, { unfollowUserID: postOwnerID });
        setFollowedUsers(followedUsers.filter((id) => id !== postOwnerID));
      } else {
        await axios.put(`http://localhost:8080/user/${userID}/follow`, { followUserID: postOwnerID });
        setFollowedUsers([...followedUsers, postOwnerID]);
      }
    } catch (error) {
      console.error('Error toggling follow state:', error);
    }
  };

  const handleAddComment = async (postId) => {
    const userID = localStorage.getItem('userID');
    if (!userID) {
      alert('Please log in to comment.');
      return;
    }
    const content = newComment[postId] || '';
    if (!content.trim()) {
      alert('Comment cannot be empty.');
      return;
    }
    try {
      const response = await axios.post(`http://localhost:8080/posts/${postId}/comment`, {
        userID,
        content,
      });
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, comments: response.data.comments } : post
        )
      );
      setFilteredPosts((prevFilteredPosts) =>
        prevFilteredPosts.map((post) =>
          post.id === postId ? { ...post, comments: response.data.comments } : post
        )
      );
      setNewComment({ ...newComment, [postId]: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const userID = localStorage.getItem('userID');
    try {
      await axios.delete(`http://localhost:8080/posts/${postId}/comment/${commentId}`, {
        params: { userID },
      });
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) }
            : post
        )
      );
      setFilteredPosts((prevFilteredPosts) =>
        prevFilteredPosts.map((post) =>
          post.id === postId
            ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) }
            : post
        )
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleSaveComment = async (postId, commentId, content) => {
    const userID = localStorage.getItem('userID');
    try {
      await axios.put(`http://localhost:8080/posts/${postId}/comment/${commentId}`, {
        userID,
        content,
      });
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id === commentId ? { ...comment, content } : comment
                ),
              }
            : post
        )
      );
      setFilteredPosts((prevFilteredPosts) =>
        prevFilteredPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id === commentId ? { ...comment, content } : comment
                ),
              }
            : post
        )
      );
      setEditingComment({});
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        (post.category && post.category.toLowerCase().includes(query))
    );
    setFilteredPosts(filtered);
  };

  const openModal = (mediaUrl) => {
    setSelectedMedia(mediaUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedMedia(null);
    setIsModalOpen(false);
  };

  return (
    <div className="modern-container">
      <NavBar />
      <div className="modern-content">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search posts by title, description, or category"
            value={searchQuery}
            onChange={handleSearch}
          />
          <button 
            className="create-button" 
            style={{ background: "linear-gradient(45deg, #a18cd1 0%, #fbc2eb 100%)" }}
            onClick={() => (window.location.href = '/addNewPost')}
          >
            <IoIosCreate className="create-icon" />
            <span>Create</span>
          </button>
        </div>
        <div className="posts-grid">
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <h3>No posts found</h3>
              <p>Create a new post to share with the community</p>
              <button 
                className="primary-button" 
                style={{ background: "linear-gradient(45deg, #a18cd1 0%, #fbc2eb 100%)", color: "white" }}
                onClick={() => (window.location.href = '/addNewPost')}
              >
                Create New Post
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      {postOwners[post.userID]?.charAt(0) || 'A'}
                    </div>
                    <div className="user-details">
                      <p className="username">{postOwners[post.userID] || 'Anonymous'}</p>
                      {post.userID !== loggedInUserID && (
                        <button
                          className={followedUsers.includes(post.userID) ? "follow-button following" : "follow-button"}
                          onClick={() => handleFollowToggle(post.userID)}
                        >
                          {followedUsers.includes(post.userID) ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  </div>
                  {post.userID === loggedInUserID && (
                    <div className="post-actions">
                      <button className="icon-button edit" onClick={() => handleUpdate(post.id)}>
                        <FaEdit />
                      </button>
                      <button className="icon-button delete" onClick={() => handleDelete(post.id)}>
                        <RiDeleteBin6Fill />
                      </button>
                    </div>
                  )}
                </div>
                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-description" style={{ whiteSpace: "pre-line" }}>{post.description}</p>
                  <div className="post-category">
                    <span>{post.category || 'Uncategorized'}</span>
                  </div>
                  {post.media && post.media.length > 0 && (
                    <div className={`media-gallery ${post.media.length === 1 ? 'single' : post.media.length === 2 ? 'double' : 'grid'}`}>
                      {post.media.slice(0, 4).map((mediaUrl, index) => (
                        <div
                          key={index}
                          className={`media-item ${post.media.length > 4 && index === 3 ? 'media-overlay' : ''}`}
                          onClick={() => openModal(mediaUrl)}
                        >
                          {mediaUrl.endsWith('.mp4') ? (
                            <video>
                              <source src={`http://localhost:8080${mediaUrl}`} type="video/mp4" />
                            </video>
                          ) : (
                            <img src={`http://localhost:8080${mediaUrl}`} alt="Post Media" />
                          )}
                          {post.media.length > 4 && index === 3 && (
                            <div className="overlay-text">+{post.media.length - 4}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="post-engagement">
                  <button 
                    className={`engagement-button`}
                    onClick={() => handleLike(post.id)}
                  >
                    <BiSolidLike />
                    <span>{Object.values(post.likes || {}).filter(liked => liked).length}</span>
                  </button>
                  <button className="engagement-button">
                    <FaCommentAlt className="engagement-icon" />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                </div>
                <div className="comment-section">
                  <div className="comment-input">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                    />
                    <button 
                      className="send-button" 
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment[post.id]} 
                    >
                      <IoSend />
                    </button>
                  </div>
                  {post.comments && post.comments.length > 0 && (
                    <div className="comments-list">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="comment">
                          <div className="comment-avatar">
                            {comment.userFullName?.charAt(0) || 'U'}
                          </div>
                          <div className="comment-body">
                            <p className="comment-author">{comment.userFullName}</p>
                            {editingComment.id === comment.id ? (
                              <input
                                type="text"
                                className="edit-comment"
                                value={editingComment.content}
                                onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                autoFocus
                              />
                            ) : (
                              <p className="comment-text">{comment.content}</p>
                            )}
                          </div>
                          <div className="comment-actions">
                            {comment.userID === loggedInUserID && (
                              <>
                                {editingComment.id === comment.id ? (
                                  <>
                                    <button 
                                      className="icon-button save" 
                                      onClick={() => handleSaveComment(post.id, comment.id, editingComment.content)}
                                    >
                                      <FiSave />
                                    </button>
                                    <button 
                                      className="icon-button cancel" 
                                      onClick={() => setEditingComment({})}
                                    >
                                      <TbPencilCancel />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      className="icon-button edit" 
                                      onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                                    >
                                      <GrUpdate />
                                    </button>
                                    <button 
                                      className="icon-button delete" 
                                      onClick={() => handleDeleteComment(post.id, comment.id)}
                                    >
                                      <MdDelete />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {post.userID === loggedInUserID && comment.userID !== loggedInUserID && (
                              <button
                                className="icon-button delete"
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                              >
                                <MdDelete />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Media Modal"
        className="media-modal"
        overlayClassName="media-modal-overlay"
      >
        <button className="close-button" onClick={closeModal}>×</button>
        {selectedMedia && selectedMedia.endsWith('.mp4') ? (
          <video controls className="modal-media">
            <source src={`http://localhost:8080${selectedMedia}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img src={`http://localhost:8080${selectedMedia}`} alt="Full Media" className="modal-media" />
        )}
      </Modal>
    </div>
  );
}

export default AllPost;
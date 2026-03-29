import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const AddComment = ({ auth, showError, showSuccess }) => {
  const { bugId } = useParams();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [bugTitle, setBugTitle] = useState('');

  useEffect(() => {
    const fetchBugDetails = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`/api/bugs/${bugId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  setBugTitle(response.data.title); // Set the bug's title here
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load bug details';
        showError(errorMessage);
      }
    };

    fetchBugDetails();
  }, [bugId, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      showError('Comment cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `/api/bugs/${bugId}/comments`,
        { text: commentText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showSuccess('Comment added successfully');
      navigate(`/bugs/${bugId}`); // Navigate back to BugDetails page
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add comment';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/bugs/${bugId}`); // Navigate back to the bug details page
  };

  return (
    <div className="page-shell add-comment">
      <div className="form-shell">
      <div className="page-header mb-3">
        <h2 className="page-title">Add Comment</h2>
        <p className="page-subtitle">{bugTitle ? `Bug: ${bugTitle}` : ''}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="commentText" className="form-label">Comment</label>
          <textarea
            id="commentText"
            className="form-control"
            rows="4"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-actions mt-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Comment'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default AddComment;

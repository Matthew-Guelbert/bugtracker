import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';

const BugDetails = ({ auth, showError, showSuccess }) => {
  const { bugId } = useParams();
  const navigate = useNavigate();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBugDetails = async () => {
      if (!auth?.token) {
        setError('Authentication required');
        showError('Please log in to view bug details');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/bugs/${bugId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setBug(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load bug details';
        console.error('Error fetching bug details:', errorMessage);
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBugDetails();
  }, [bugId, auth?.token, showError, showSuccess]);

  const handleGoBack = useCallback(() => {
    navigate('/bugs');
  }, [navigate]);

  const handleAddComment = useCallback(() => {
    navigate(`/bugs/${bugId}/add-comment`);
  }, [navigate, bugId]);

  const handleAddTestCase = useCallback(() => {
    navigate(`/bugs/${bugId}/add-test`);
  }, [navigate, bugId]);

  const handleLogTime = useCallback(() => {
    navigate(`/bugs/${bugId}/log-hours`);
  }, [navigate, bugId]);

  const handleEditBug = useCallback(() => {
    navigate(`/bugs/${bugId}/edit`);
  }, [navigate, bugId]);

  const handleViewTestCases = useCallback(() => {
    navigate(`/bugs/${bugId}/test-cases`);
  }, [navigate, bugId]);

  const handleViewLogs = useCallback(() => {
    navigate(`/bugs/${bugId}/logs`);
  }, [navigate, bugId]);

  const handleEditTestCase = useCallback((testId) => {
    navigate(`/bugs/${bugId}/tests/${testId}/edit`);
  }, [navigate, bugId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!bug) {
    return <div className="alert alert-danger">Bug not found.</div>;
  }

  // Role and permission checks with safety checks
  const userRoles = auth?.role || [];
  const userName = auth?.name || '';
  
  const isAdmin = userRoles.includes('Admin');
  const isDeveloper = userRoles.includes('Developer');
  const isQualityAnalyst = userRoles.includes('Quality Analyst');
  const isProductManager = userRoles.includes('Product Manager');
  const isAuthor = userName === (bug.author || bug.createdBy);
  const isAssignedToUser = userName === bug.assignedToUserName;

  return (
    <div className="bug-details">
      <h2>{bug.title}</h2>
      <p><strong>Description:</strong> {bug.description}</p>
      <p><strong>Steps to Reproduce:</strong> {bug.stepsToReproduce}</p>
      <p>
        <strong>Classification:</strong>{' '}
        <span className={`badge ${bug.classification === 'approved' ? 'bg-success' : 'bg-danger'}`}>
          {bug.classification}
        </span>
      </p>
      <p>
        <strong>Status:</strong> 
        <span className={`badge ${bug.closed ? 'bg-danger' : 'bg-success'}`}>
          {bug.closed ? 'Closed' : 'Open'}
        </span>
      </p>
      <p><strong>Created On:</strong> {moment(bug.createdOn).format('LL')}</p>
      <p><strong>Created By:</strong> {bug.author || bug.createdBy}</p>
      <div>
        <h3>Comments</h3>
        {bug.comments.length === 0 ? (
          <p>No comments yet...</p>
        ) : (
          <ul className="list-group">
            {bug.comments.map((comment) => (
              <li key={comment._id} className="list-group-item">
                <strong>{comment.author}:</strong> {comment.text}
                <br />
                <small>{moment(comment.createdOn).fromNow()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4">
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={handleGoBack}>
            Go Back
          </button>
          <button className="btn btn-primary" onClick={handleAddComment}>
            Add Comment
          </button>
          {(isAdmin || isQualityAnalyst) && (
            <button className="btn btn-success" onClick={handleAddTestCase}>
              Add Test Case
            </button>
          )}
          {(isAdmin || isDeveloper) && (
            <button className="btn btn-info" onClick={handleLogTime}>
              Log Time
            </button>
          )}
          {(isAdmin || isAuthor || isAssignedToUser || isProductManager) && (
            <button className="btn btn-warning" onClick={handleEditBug}>
              Edit Bug
            </button>
          )}
          <button className="btn btn-outline-primary" onClick={handleViewTestCases}>
            View Test Cases
          </button>
          <button className="btn btn-outline-info" onClick={handleViewLogs}>
            View Logs
          </button>
          {(isAdmin || isQualityAnalyst) && bug.testId && (
            <button className="btn btn-outline-warning" onClick={() => handleEditTestCase(bug.testId)}>
              Edit Test Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

BugDetails.propTypes = {
  auth: PropTypes.shape({
    token: PropTypes.string.isRequired,
    role: PropTypes.array.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
};

export default BugDetails;

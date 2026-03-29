import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';

const BugDetails = ({ auth, showError }) => {
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
        const response = await axios.get(`/api/bugs/${bugId}`, {
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
  }, [bugId, auth?.token, showError]);

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

  const classificationClass = {
    Approved: 'badge badge-gradient badge-gradient-primary',
    Unapproved: 'badge badge-gradient badge-gradient-danger',
    Duplicate: 'badge badge-gradient badge-gradient-warning',
  }[bug.classification] || 'badge badge-gradient badge-gradient-secondary';

  return (
    <div className="page-shell bug-details">
      <div className="detail-shell">
        <div className="page-header mb-3">
          <h2 className="page-title">{bug.title}</h2>
          <span className={bug.closed ? 'badge badge-gradient badge-gradient-danger' : 'badge badge-gradient badge-gradient-success'}>
            {bug.closed ? 'Closed' : 'Open'}
          </span>
        </div>

        <div className="detail-grid mb-3">
          <div className="detail-item">
            <span className="label">Classification</span>
            <span className={classificationClass}>{bug.classification}</span>
          </div>
          <div className="detail-item">
            <span className="label">Created On</span>
            <span>{moment(bug.createdOn).format('LL')}</span>
          </div>
          <div className="detail-item">
            <span className="label">Created By</span>
            <span>{bug.author || bug.createdBy}</span>
          </div>
          <div className="detail-item">
            <span className="label">Assigned To</span>
            <span>{bug.assignedToUserName || 'Unassigned'}</span>
          </div>
        </div>

        <div className="detail-item mb-3">
          <span className="label">Description</span>
          <p className="mb-0">{bug.description}</p>
        </div>
        <div className="detail-item mb-4">
          <span className="label">Steps To Reproduce</span>
          <p className="mb-0">{bug.stepsToReproduce}</p>
        </div>

        <h4 className="mb-3">Comments</h4>
        {bug.comments.length === 0 ? (
          <div className="empty-state">No comments yet.</div>
        ) : (
          <ul className="list-group clean-list">
            {bug.comments.map((comment) => (
              <li key={comment._id} className="list-group-item">
                <p className="mb-1"><strong>{comment.author}</strong> {comment.text}</p>
                <small className="text-muted">{moment(comment.createdOn).fromNow()}</small>
              </li>
            ))}
          </ul>
        )}

        <div className="actions-row mt-4">
          <button className="btn btn-secondary" onClick={handleGoBack}>Back</button>
          <button className="btn btn-primary" onClick={handleAddComment}>Add Comment</button>
          {(isAdmin || isQualityAnalyst) && (
            <button className="btn btn-secondary" onClick={handleAddTestCase}>Add Test Case</button>
          )}
          {(isAdmin || isDeveloper) && (
            <button className="btn btn-secondary" onClick={handleLogTime}>Log Time</button>
          )}
          {(isAdmin || isAuthor || isAssignedToUser || isProductManager) && (
            <button className="btn btn-secondary" onClick={handleEditBug}>Edit Bug</button>
          )}
          <button className="btn btn-secondary" onClick={handleViewTestCases}>View Test Cases</button>
          <button className="btn btn-secondary" onClick={handleViewLogs}>View Logs</button>
          {(isAdmin || isQualityAnalyst) && bug.testId && (
            <button className="btn btn-secondary" onClick={() => handleEditTestCase(bug.testId)}>Edit Test Case</button>
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
};

export default BugDetails;

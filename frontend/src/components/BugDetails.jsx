import React, { useState, useEffect } from 'react';
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
      try {
        const token = localStorage.getItem('authToken');
        console.log('Fetching bug details for bugId:', bugId);
        const response = await axios.get(`/api/bugs/${bugId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Bug details response:', response.data);
        setBug(response.data);
        showSuccess('Bug details loaded successfully');
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
  }, [bugId, showError, showSuccess]);

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleAddComment = () => {
    navigate(`/bugs/${bugId}/add-comment`); // Navigate to AddComment page
  };

  const handleAddTestCase = () => {
    navigate(`/bugs/${bugId}/add-test`); // Navigate to AddTestCase page
  };

  const handleLogTime = () => {
    navigate(`/bugs/${bugId}/log-hours`); // Navigate to LogHours page
  };

  const handleEditBug = () => {
    navigate(`/bugs/${bugId}/edit`); // Navigate to BugEditor page
  };

  const handleViewTestCases = () => {
    navigate(`/bugs/${bugId}/test-cases`); // Navigate to CaseDetails page
  };

  const handleViewLogs = () => {
    navigate(`/bugs/${bugId}/logs`); // Navigate to ViewLogs page
  };

  const handleEditTestCase = (testId) => {
    navigate(`/bugs/${bugId}/tests/${testId}/edit`); // Navigate to EditTestCase page
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!bug) {
    return <div className="alert alert-danger">Bug not found.</div>;
  }

  console.log('Bug details:', bug);

  const isAdmin = auth.role.includes('Admin');
  const isDeveloper = auth.role.includes('Developer');
  const isBusinessAnalyst = auth.role.includes('Business Analyst');
  const isQualityAnalyst = auth.role.includes('Quality Analyst');
  const isProductManager = auth.role.includes('Product Manager');
  const isAuthor = auth.name === (bug.author || bug.createdBy);
  const isAssignedToUser = auth.name === bug.assignedToUserName;

  return (
    <div className="bug-details">
      <h2>{bug.title}</h2>
      <p><strong>Description:</strong> {bug.description}</p>
      <p><strong>Steps to Reproduce:</strong> {bug.stepsToReproduce}</p>
      <p>
        <strong>Classification:</strong> 
        <span className={`badge ${bug.classification === 'approved' ? 'bg-success' : 'bg-danger'}`} />
        {bug.classification}
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
      <button className="btn btn-secondary" onClick={handleGoBack}>Go Back</button>
      <button className="btn btn-primary ms-2" onClick={handleAddComment}>Add Comment</button>
      {(isAdmin || isQualityAnalyst) && (
        <button className="btn btn-primary ms-2" onClick={handleAddTestCase}>Add Test Case</button>
      )}
      {(isAdmin || isDeveloper) && (
        <button className="btn btn-primary ms-2" onClick={handleLogTime}>Log Time</button>
      )}
      {(isAdmin || isAuthor || isAssignedToUser || isProductManager) && (
        <button className="btn btn-primary ms-2" onClick={handleEditBug}>Edit Bug</button>
      )}
      <button className="btn btn-primary ms-2" onClick={handleViewTestCases}>View Test Cases</button>
      <button className="btn btn-primary ms-2" onClick={handleViewLogs}>View Logs</button>
      {(isAdmin || isQualityAnalyst) && (
        <button className="btn btn-primary ms-2" onClick={() => handleEditTestCase(bug.testId)}>Edit Test Case</button>
      )}
    </div>
  );
};

export default BugDetails;

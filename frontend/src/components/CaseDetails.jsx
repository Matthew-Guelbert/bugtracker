import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const CaseDetails = ({ auth, showError, showSuccess }) => {
  const { bugId } = useParams();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestCases = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`/api/bugs/${bugId}/tests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTests(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load test cases';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTestCases();
  }, [bugId, showError]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="page-shell case-details">
      <div className="detail-shell">
      <div className="page-header mb-3">
        <h2 className="page-title">Test Cases For Bug {bugId}</h2>
      </div>
      {tests.length === 0 ? (
        <div className="empty-state">No test cases found.</div>
      ) : (
        <ul className="list-group clean-list">
          {tests.map((test) => (
            <li key={test._id} className="list-group-item">
              <h5>{test.title}</h5>
              <p><strong>Description:</strong> {test.description}</p>
              <p><strong>Status:</strong> {test.status}</p>
              <p><strong>Created On:</strong> {new Date(test.createdOn).toLocaleDateString()}</p>
              <p><strong>Created By:</strong> {test.createdBy}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="actions-row mt-4">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
      </div>
    </div>
  );
};

export default CaseDetails;
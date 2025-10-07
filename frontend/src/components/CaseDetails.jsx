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
        showSuccess('Test cases loaded successfully');
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load test cases';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTestCases();
  }, [bugId, showError, showSuccess]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="case-details">
      <h2>Test Cases for Bug {bugId}</h2>
      {tests.length === 0 ? (
        <p>No test cases found.</p>
      ) : (
        <ul className="list-group">
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
      <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default CaseDetails;
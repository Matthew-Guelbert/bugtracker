import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ViewLogs = ({ auth, showError, showSuccess }) => {
  const { bugId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`/api/bugs/${bugId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(response.data.bug.timeLogs || []);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load logs';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [bugId, showError]);

  const handleEditTestCase = (testId) => {
    navigate(`/bugs/${bugId}/tests/${testId}/edit`);
  };

  const handleDeleteTestCase = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test case?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`/api/bugs/${bugId}/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccess('Test case deleted successfully.');
      setLogs(logs.filter(log => log._id !== testId));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete test case';
      showError(errorMessage);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const isAdmin = auth.role.includes('Admin');
  const isQualityAnalyst = auth.role.includes('Quality Analyst');

  return (
    <div className="page-shell view-logs">
      <div className="detail-shell">
      <div className="page-header mb-3">
        <h2 className="page-title">Logs For Bug {bugId}</h2>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">No logs found.</div>
      ) : (
        <ul className="list-group clean-list">
          {logs.map((log, index) => (
            <li key={index} className="list-group-item">
              <p><strong>Hours:</strong> {log.hours}</p>
              <p><strong>Version:</strong> {log.version}</p>
              <p><strong>Date Fixed:</strong> {new Date(log.dateFixed).toLocaleDateString()}</p>
              <p><strong>Notes:</strong> {log.notes}</p>
              <p><strong>Logged By:</strong> {log.loggedBy}</p>
              <p><strong>Logged On:</strong> {new Date(log.loggedOn).toLocaleDateString()}</p>
              {(isAdmin || isQualityAnalyst) && (
                <div className="actions-row mt-3">
                  <button className="btn btn-secondary" onClick={() => handleEditTestCase(log._id)}>Edit Test Case</button>
                  <button className="btn btn-secondary" onClick={() => handleDeleteTestCase(log._id)}>Delete Test Case</button>
                </div>
              )}
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

export default ViewLogs;
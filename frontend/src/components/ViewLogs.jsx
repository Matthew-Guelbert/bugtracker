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
        const response = await axios.get(`/api/bugs/${bugId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        // GET /api/bugs/:bugId returns the bug document directly.
        setLogs(response.data.timeLogs || []);
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Failed to load logs';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [bugId, auth.token, showError]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

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
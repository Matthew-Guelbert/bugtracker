import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const LogHours = ({ auth, showError, showSuccess }) => {
  const { bugId } = useParams();
  const navigate = useNavigate();
  const [hours, setHours] = useState('');
  const [version, setVersion] = useState('');
  const [dateFixed, setDateFixed] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'hours') setHours(value);
    if (name === 'version') setVersion(value);
    if (name === 'dateFixed') setDateFixed(value);
    if (name === 'notes') setNotes(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/api/bugs/${bugId}/log-hours`, { hours, version, dateFixed, notes }, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      showSuccess('Hours logged successfully.');
      navigate(`/bugs/${bugId}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to log hours';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell log-hours">
      <div className="form-shell">
      <div className="page-header mb-3">
        <h2 className="page-title">Log Hours</h2>
        <p className="page-subtitle">Bug #{bugId}</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="hours" className="form-label">Hours</label>
          <input
            type="number"
            id="hours"
            name="hours"
            className="form-control"
            value={hours}
            onChange={handleInputChange}
            required
            min="0.1"
            step="0.1"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="version" className="form-label">Version</label>
          <input
            type="text"
            id="version"
            name="version"
            className="form-control"
            value={version}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="dateFixed" className="form-label">Date Fixed</label>
          <input
            type="date"
            id="dateFixed"
            name="dateFixed"
            className="form-control"
            value={dateFixed}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="notes" className="form-label">Notes</label>
          <textarea
            id="notes"
            name="notes"
            className="form-control"
            value={notes}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-actions mt-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging...' : 'Log Hours'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default LogHours;
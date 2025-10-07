import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const AddTest = ({ auth, showError, showSuccess }) => {
  const { bugId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState({
    title: '',
    description: '',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTest((prevTest) => ({ ...prevTest, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/api/bugs/${bugId}/tests`, test, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      showSuccess('Test added successfully.');
      navigate(`/bugs/${bugId}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add test';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-test">
      <h2>Add Test</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-control"
            value={test.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            value={test.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="status" className="form-label">Status</label>
          <select
            id="status"
            name="status"
            className="form-select"
            value={test.status}
            onChange={handleInputChange}
            required
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Error">Error</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Test'}
        </button>
      </form>
    </div>
  );
};

export default AddTest;
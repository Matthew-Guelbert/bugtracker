import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditTestCase = ({ auth, showError, showSuccess }) => {
  const { bugId, testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState({
    title: '',
    description: '',
    status: 'Pending'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('bugId:', bugId);
    console.log('testId:', testId);

    const fetchTestCase = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`/api/bugs/${bugId}/tests/${testId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched test case:', response.data);
        setTest(response.data);
        showSuccess('Test case loaded successfully');
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load test case';
        console.error('Error fetching test case:', errorMessage);
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTestCase();
  }, [bugId, testId, showError, showSuccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTest((prevTest) => ({ ...prevTest, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      console.log('Submitting test case update:', test);
      const response = await axios.patch(`/api/bugs/${bugId}/tests/${testId}`, test, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Update response:', response.data);
      showSuccess('Test case updated successfully.');
      navigate(`/bugs/${bugId}/logs`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update test case';
      console.error('Error updating test case:', errorMessage);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="edit-test-case">
      <h2>Edit Test Case</h2>
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
          {loading ? 'Updating...' : 'Update Test Case'}
        </button>
        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={() => navigate(`/bugs/${bugId}/logs`)}
          disabled={loading}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditTestCase;
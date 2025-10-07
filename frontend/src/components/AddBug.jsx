import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddBug.css';

const AddBug = ({ auth, showError, showSuccess }) => {
  const [bug, setBug] = useState({
    title: '',
    description: '',
    stepsToReproduce: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getUserFromToken = () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return 'Unknown'; // Fallback if no token

    const decodedToken = JSON.parse(atob(authToken.split('.')[1])); // Decode JWT payload
    return decodedToken.name || 'Unknown'; // Use name from token or fallback to 'Unknown'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for required fields
    if (!bug.title || !bug.description || !bug.stepsToReproduce) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/bugs', {
        ...bug,
        author: getUserFromToken(), // Set the bug author
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Bug created successfully:', response.data);
      setBug({ // Reset bug form after submission
        title: '',
        description: '',
        stepsToReproduce: '',
      });
      showSuccess('Bug created successfully');
      navigate('/bugs'); // Redirect to BugList.jsx
    } catch (error) {
      console.error('Error creating bug:', error);
      setError('Failed to create the bug. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBug((prevBug) => ({
      ...prevBug,
      [name]: value,
    }));
  };

  return (
    <div className="add-bug">
      <h2>Report a Bug</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-control"
            value={bug.title}
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
            value={bug.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="stepsToReproduce" className="form-label">Steps to Reproduce</label>
          <textarea
            id="stepsToReproduce"
            name="stepsToReproduce"
            className="form-control"
            value={bug.stepsToReproduce}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Bug'}
        </button>
        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={() => navigate(-1)} // Navigate back to the previous page
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default AddBug;

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
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

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for required fields
    if (!bug.title || !bug.description || !bug.stepsToReproduce) {
      setError('Please fill out all fields.');
      showError('Please fill out all fields.');
      return;
    }

    // Check if user is authenticated
    if (!auth?.token || !auth?.name) {
      setError('Authentication required. Please log in again.');
      showError('Authentication required. Please log in again.');
      return;
    }

    console.log('Auth data:', { token: auth.token, name: auth.name });
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      await axios.post('http://localhost:5000/api/bugs', {
        ...bug,
        author: auth.name, // Use auth.name as required by schema
      }, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      
      setBug({ // Reset bug form after submission
        title: '',
        description: '',
        stepsToReproduce: '',
      });
      showSuccess('Bug created successfully');
      navigate('/bugs'); // Redirect to BugList.jsx
    } catch (error) {
      console.error('Error creating bug:', error);
      console.error('Error response:', error.response?.data);
      console.error('Full error details:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error status:', error.response?.status);
      console.error('Request data sent:', {
        ...bug,
        author: auth.name,
      });
      
      // Handle validation errors specifically
      let errorMessage = 'Failed to create the bug. Please try again.';
      if (error.response?.data?.error) {
        if (Array.isArray(error.response.data.error)) {
          errorMessage = error.response.data.error.join(', ');
        } else {
          errorMessage = error.response.data.error;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      showError(errorMessage);
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
          onClick={handleCancel}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

AddBug.propTypes = {
  auth: PropTypes.shape({
    token: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
};

export default AddBug;

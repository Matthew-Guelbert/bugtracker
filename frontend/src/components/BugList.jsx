import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import BugListItem from './BugListItem';

const BugList = ({ auth, showError, showSuccess }) => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [keywords, setKeywords] = useState('');
  const [classification, setClassification] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minAge, setMinAge] = useState('');
  const [closed, setClosed] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const [debounceTimer, setDebounceTimer] = useState(null);

  const navigate = useNavigate();
  const keywordsRef = useRef(null); // Reference for the keywords input field

  // Fetch bugs based on search criteria
  const fetchBugs = useCallback(async () => {
    console.log('Fetching bugs with criteria:', { keywords, classification, maxAge, minAge, closed, sortBy });
    setLoading(true);
    try {
      const response = await axios.get('/api/bugs', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        params: {
          keywords,
          classification,
          maxAge,
          minAge,
          closed,
          sortBy,
        },
      });
      console.log('Bugs response:', response.data);
      setBugs(response.data);
      showSuccess('Bugs loaded successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load bugs';
      console.error('Error fetching bugs:', errorMessage);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      console.log('Loading state set to false');
    }
  }, [auth.token, keywords, classification, maxAge, minAge, closed, sortBy, showError, showSuccess]);

  // Debounced useEffect for search criteria changes
  useEffect(() => {
    console.log('Search criteria changed:', { keywords, classification, maxAge, minAge, closed, sortBy });
    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set a new debounce timer
    const timer = setTimeout(() => {
      fetchBugs();
    }, 500); // Adjust debounce time as needed (500ms delay)

    setDebounceTimer(timer);

    // Cleanup function
    return () => clearTimeout(timer);
  }, [keywords, classification, maxAge, minAge, closed, sortBy, fetchBugs]);

  // Re-focus the keywords input field after component updates
  useEffect(() => {
    if (keywordsRef.current) {
      keywordsRef.current.focus();
    }
  }, [bugs]);

  const memoizedBugs = useMemo(() => {
    return bugs.map((bug) => (
      <Link
        key={bug._id}
        to={`/bugs/${bug._id}`}
        className="text-decoration-none text-dark"
      >
        <BugListItem item={bug} />
      </Link>
    ));
  }, [bugs]);

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="bug-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Bug Tracker</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/bugs/add')}
        >
          Report Bug
        </button>
      </div>

      {/* Search Interface */}
      <div className="search-interface mb-4">
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by keyword"
            name="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            ref={keywordsRef} // Attach the ref to the input field
          />
        </div>

        <div className="row">
          <div className="col-md-3">
            <label>Classification:</label>
            <select
              name="classification"
              className="form-select"
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
            >
              <option value="">All</option>
              <option value="Approved">Approved</option>
              <option value="Unapproved">Unapproved</option>
              <option value="Duplicate">Duplicate</option>
            </select>
          </div>

          <div className="col-md-3">
            <label>Max Age (days):</label>
            <input
              type="number"
              name="maxAge"
              className="form-control"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label>Min Age (days):</label>
            <input
              type="number"
              name="minAge"
              className="form-control"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label>Closed:</label>
            <input
              type="checkbox"
              name="closed"
              checked={closed}
              onChange={(e) => setClosed(e.target.checked)}
            />
          </div>

          <div className="col-md-3">
            <label>Sort By:</label>
            <select
              name="sortBy"
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
              <option value="classification">Classification</option>
              <option value="assignedTo">Assigned To</option>
              <option value="createdBy">Reported By</option>
            </select>
          </div>
        </div>
      </div>

      {bugs.length === 0 && !loading ? (
        <div className="alert alert-info my-4">
          No bugs found.
          <div className="mt-3">
            <button
              className="btn btn-secondary"
              onClick={() => navigate(-1)} // Use navigate(-1) to go back to the previous page
            >
              Go Back
            </button>
          </div>
        </div>
      ) : (
        memoizedBugs
      )}
    </div>
  );
};

export default BugList;

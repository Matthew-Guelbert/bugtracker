import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import MyBugListItem from './MyBugListItem';

const MyBugList = ({ auth, showError }) => {
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
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/bugs/my-bugs', {
        headers: {
          Authorization: `Bearer ${token}`,
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
      setBugs(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load bugs';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [auth.token, keywords, classification, maxAge, minAge, closed, sortBy, showError]);

  // Debounced useEffect for search criteria changes
  useEffect(() => {
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
        <MyBugListItem item={bug} />
      </Link>
    ));
  }, [bugs]);

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="bug-list page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Bugs</h2>
          <p className="page-subtitle">Focus on issues currently assigned to you.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/landing')}>
          Back to Home
        </button>
      </div>

      <div className="list-layout">
        <aside className="filter-panel">
          <h5>Filters</h5>
          <div className="mb-3">
            <label className="form-label fw-semibold">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by keyword"
              name="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              ref={keywordsRef}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Classification</label>
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

          <div className="mb-3">
            <label className="form-label fw-semibold">Max Age (days)</label>
            <input
              type="number"
              name="maxAge"
              className="form-control"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Min Age (days)</label>
            <input
              type="number"
              name="minAge"
              className="form-control"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Closed</label>
            <div className="form-check form-switch mt-1">
              <input
                className="form-check-input"
                type="checkbox"
                name="closed"
                checked={closed}
                onChange={(e) => setClosed(e.target.checked)}
                id="myBugsClosedSwitch"
              />
            </div>
          </div>

          <div>
            <label className="form-label fw-semibold">Sort By</label>
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
        </aside>

        <section className="content-panel">
          {bugs.length === 0 && !loading ? (
            <div className="empty-state my-4">No bugs found.</div>
          ) : (
            memoizedBugs
          )}
        </section>
      </div>
    </div>
  );
};

export default MyBugList;
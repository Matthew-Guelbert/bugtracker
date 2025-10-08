import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
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

  const navigate = useNavigate();
  const keywordsRef = useRef(null); // Reference for the keywords input field
  const debounceTimerRef = useRef(null); // Reference for the debounce timer

  // Fetch bugs based on search criteria
  const fetchBugs = useCallback(async () => {
    if (!auth?.token) {
      setError('Authentication required');
      showError('Please log in to view bugs');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await axios.get('http://localhost:5000/api/bugs', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        params: {
          keywords: keywords.trim(),
          classification,
          maxAge: maxAge || undefined,
          minAge: minAge || undefined,
          closed,
          sortBy,
        },
      });
      setBugs(response.data);
      if (response.data.length === 0 && keywords.trim()) {
        showSuccess('No bugs found matching your search criteria');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load bugs';
      console.error('Error fetching bugs:', errorMessage);
      setError(errorMessage);
      showError(errorMessage);
      setBugs([]); // Clear bugs on error
    } finally {
      setLoading(false);
    }
  }, [auth.token, keywords, classification, maxAge, minAge, closed, sortBy, showError, showSuccess]);

  // Debounced useEffect for search criteria changes
  useEffect(() => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      fetchBugs();
    }, 500); // 500ms delay for debounce

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [keywords, classification, maxAge, minAge, closed, sortBy, fetchBugs]);



  const handleReportBug = useCallback(() => {
    navigate('/bugs/add');
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

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
          onClick={handleReportBug}
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
              onClick={handleGoBack}
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

BugList.propTypes = {
  auth: PropTypes.shape({
    token: PropTypes.string.isRequired,
  }).isRequired,
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
};

export default BugList;

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
  const [onlyMine, setOnlyMine] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [pageSize, setPageSize] = useState(10);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBugs, setTotalBugs] = useState(0);

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
      const response = await axios.get('/api/bugs', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        params: {
          keywords: keywords.trim(),
          classification,
          maxAge: maxAge || undefined,
          minAge: minAge || undefined,
          closed,
          onlyMine,
          sortBy,
          pageSize,
          pageNumber,
        },
      });
      setBugs(response.data.bugs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalBugs(response.data.totalBugs || 0);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load bugs';
      console.error('Error fetching bugs:', errorMessage);
      setError(errorMessage);
      showError(errorMessage);
      setBugs([]); // Clear bugs on error
      setTotalPages(1);
      setTotalBugs(0);
    } finally {
      setLoading(false);
    }
  }, [auth.token, keywords, classification, maxAge, minAge, closed, onlyMine, sortBy, pageSize, pageNumber, showError]);

  // Debounced useEffect for search criteria changes and pagination
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchBugs();
    }, 500);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [keywords, classification, maxAge, minAge, closed, onlyMine, sortBy, pageSize, pageNumber, fetchBugs]);



  const handleReportBug = useCallback(() => {
    navigate('/bugs/add');
  }, [navigate]);

  const handleMyQueue = useCallback(() => {
    navigate('/my-bugs');
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const getStatusGradient = (closed) =>
    closed
      ? 'badge-gradient badge-gradient-danger'
      : 'badge-gradient badge-gradient-success';

  const getClassificationGradient = (classification) => {
    switch (classification) {
      case 'Approved':
        return 'badge-gradient badge-gradient-primary';
      case 'Duplicate':
        return 'badge-gradient badge-gradient-warning';
      case 'Unapproved':
        return 'badge-gradient badge-gradient-secondary';
      default:
        return 'badge-gradient badge-gradient-light';
    }
  };

  const memoizedBugs = useMemo(() => {
    if (bugs.length === 0) return null;
    return (
      <div className="table-responsive">
        <table className="table table-hover align-middle bg-white border rounded shadow-sm">
          <thead className="table-light">
            <tr>
              <th style={{ minWidth: 180 }}>Title</th>
              <th>Status</th>
              <th>Classification</th>
              <th>Assigned To</th>
              <th>Created By</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bugs.map((bug) => (
              <tr key={bug._id} className="bug-row">
                <td>
                  <Link to={`/bugs/${bug._id}`} className="fw-semibold text-decoration-none text-primary">
                    {bug.title}
                  </Link>
                  <div className="text-muted small text-truncate" style={{ maxWidth: 250 }}>
                    {bug.description?.length > 80 ? bug.description.slice(0, 80) + '…' : bug.description}
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusGradient(bug.closed)}`}>{bug.closed ? 'Closed' : 'Open'}</span>
                </td>
                <td>
                  <span className={`badge ${getClassificationGradient(bug.classification)}`}>{bug.classification || 'Unclassified'}</span>
                </td>
                <td>{bug.assignedToUserName || <span className="text-muted">Unassigned</span>}</td>
                <td>{bug.author || bug.createdBy || 'Unknown'}</td>
                <td>{new Date(bug.createdOn).toLocaleDateString()}</td>
                <td>
                  <Link to={`/bugs/${bug._id}`} className="btn btn-sm btn-outline-primary me-1" title="View"><i className="bi bi-eye"></i></Link>
                  <Link to={`/bugs/${bug._id}/edit`} className="btn btn-sm btn-outline-secondary" title="Edit"><i className="bi bi-pencil"></i></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [bugs]);

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="bug-list container-fluid">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <h2 className="fw-bold mb-0">Bug Tracker</h2>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-secondary" onClick={handleMyQueue}>
            <i className="bi bi-person-lines-fill me-2"></i>My Queue
          </button>
          <button
            className="btn btn-primary btn-lg px-4"
            onClick={handleReportBug}
          >
            <i className="bi bi-plus-circle me-2"></i>Report Bug
          </button>
        </div>
      </div>

      <div className="row">
        {/* Sidebar for search/filters */}
        <div className="col-md-3 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Filters</h5>
              <div className="mb-3">
                <label className="form-label fw-semibold">Search</label>
                <div className="position-relative">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" style={{ pointerEvents: 'none', fontSize: '1.2rem' }}></i>
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Keyword..."
                    name="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    ref={keywordsRef}
                    style={{ minHeight: 40 }}
                  />
                </div>
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
                    id="closedSwitch"
                  />
                  <label className="form-check-label" htmlFor="closedSwitch"></label>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Only My Queue</label>
                <div className="form-check form-switch mt-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="onlyMine"
                    checked={onlyMine}
                    onChange={(e) => {
                      setOnlyMine(e.target.checked);
                      setPageNumber(1);
                    }}
                    id="onlyMineSwitch"
                  />
                  <label className="form-check-label" htmlFor="onlyMineSwitch"></label>
                </div>
              </div>
              <div className="mb-3">
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
              <div className="mb-3">
                <label className="form-label fw-semibold">Page Size</label>
                <select
                  className="form-select"
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPageNumber(1); }}
                >
                  {[5, 10, 20, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Bug list table */}
        <div className="col-md-9">
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
            <>
              <div className="mt-4">{memoizedBugs}</div>
              {/* Pagination controls */}
              <nav aria-label="Bug list pagination" className="mt-3">
                <ul className="pagination justify-content-center">
                  <li className={`page-item${pageNumber === 1 ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPageNumber(pageNumber - 1)} disabled={pageNumber === 1}>&laquo; Prev</button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                    <li key={num} className={`page-item${num === pageNumber ? ' active' : ''}`}>
                      <button className="page-link" onClick={() => setPageNumber(num)}>{num}</button>
                    </li>
                  ))}
                  <li className={`page-item${pageNumber === totalPages ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPageNumber(pageNumber + 1)} disabled={pageNumber === totalPages}>Next &raquo;</button>
                  </li>
                </ul>
                <div className="text-center text-muted small">Page {pageNumber} of {totalPages} ({totalBugs} bugs)</div>
              </nav>
            </>
          )}
        </div>
      </div>
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

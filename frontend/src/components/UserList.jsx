import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import UserListItem from './UserListItem';

const UserList = ({ auth, showError }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [keywords, setKeywords] = useState('');
  const [role, setRole] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minAge, setMinAge] = useState('');
  const [sortBy, setSortBy] = useState('givenName');

  // Pagination state
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Default to 5 users per page

  // Debounce timer reference
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Fetch users based on search criteria
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        params: {
          keywords,
          role,
          maxAge,
          minAge,
          sortBy,
          pageSize,
          pageNumber: currentPage, // Include currentPage in API request
        },
      });

      setUsers(response.data.users); // Assuming 'users' is the key for returned data
      setTotalUsers(response.data.totalUsers); // Assuming 'totalUsers' is the key for total count
      setTotalPages(Math.ceil(response.data.totalUsers / pageSize)); // Calculate total pages
      setError(null); // Clear errors if successful
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load users';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [auth.token, keywords, role, maxAge, minAge, sortBy, pageSize, currentPage, showError]);

  // Debounced useEffect for search criteria changes
  useEffect(() => {
    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set a new debounce timer
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); // Adjust debounce time as needed (500ms delay)

    setDebounceTimer(timer);

    // Cleanup function
    return () => clearTimeout(timer);
  }, [keywords, role, maxAge, minAge, sortBy, currentPage, pageSize, fetchUsers]);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value)); // Update page size and reset to the first page
    setCurrentPage(1);
  };

  return (
    <div className="user-list page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">Browse teammates and quickly manage account roles.</p>
        </div>
      </div>

      <div className="list-layout">
        <aside className="filter-panel">
          <h5>Filters</h5>
          <div className="mb-3">
            <label className="form-label fw-semibold">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by keywords"
              name="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Role</label>
            <select
              name="role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">All</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
              <option value="Developer">Developer</option>
              <option value="Business Analyst">Business Analyst</option>
              <option value="Quality Analyst">Quality Analyst</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Technical Manager">Technical Manager</option>
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
            <label className="form-label fw-semibold">Sort By</label>
            <select
              name="sortBy"
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="givenName">Given Name</option>
              <option value="familyName">Family Name</option>
              <option value="role">Role</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          <div>
            <label className="form-label fw-semibold">Users per page</label>
            <select
              className="form-select"
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </div>
        </aside>

        <section className="content-panel">
          {error && (
            <div className="alert alert-danger my-4">{error}</div>
          )}

          {loading ? (
            <div className="d-flex justify-content-center my-4">
              <span>Loading...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state my-4">No users found.</div>
          ) : (
            users.map((user) => {
              return (
                <Link
                  key={user._id}
                  to={`/users/${user._id}`}
                  className="text-decoration-none text-dark"
                >
                  <UserListItem item={user} auth={auth} />
                </Link>
              );
            })
          )}

          <div className="pagination-controls d-flex justify-content-between align-items-center my-4">
            <button
              className="btn btn-secondary"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-muted small">Page {currentPage} of {totalPages} ({totalUsers} users)</span>
            <button
              className="btn btn-secondary"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserList;

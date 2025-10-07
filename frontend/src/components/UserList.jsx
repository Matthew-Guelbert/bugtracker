import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import UserListItem from './UserListItem';

const UserList = ({ auth, showError, showSuccess }) => {
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
  const fetchUsers = async () => {
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

      console.log('Users response:', response.data);
      setUsers(response.data.users); // Assuming 'users' is the key for returned data
      setTotalUsers(response.data.totalUsers); // Assuming 'totalUsers' is the key for total count
      setTotalPages(Math.ceil(response.data.totalUsers / pageSize)); // Calculate total pages

      showSuccess('User list loaded successfully');
      setError(null); // Clear errors if successful
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load users';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
  }, [keywords, role, maxAge, minAge, sortBy, currentPage, pageSize]); // Trigger on search inputs change, page size change, or page change

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
    <div className="user-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User List</h2>
      </div>

      {/* Search Interface */}
      <div className="search-interface mb-4">
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by keywords"
            name="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <div className="row">
          <div className="col-md-3">
            <label>Role:</label>
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

          <div className="col-md-3">
            <label>Max Age (days):</label>
            <div className="input-group">
              <input
                type="number"
                name="maxAge"
                className="form-control"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
              <span className="input-group-text">days</span>
            </div>
          </div>

          <div className="col-md-3">
            <label>Min Age (days):</label>
            <div className="input-group">
              <input
                type="number"
                name="minAge"
                className="form-control"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
              <span className="input-group-text">days</span>
            </div>
          </div>

          <div className="col-md-3">
            <label>Sort By:</label>
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
        </div>
      </div>

      {/* Page Size Selector */}
      <div className="page-size-selector mb-4">
        <label>Users per page:</label>
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

      {error && (
        <div className="alert alert-danger my-4">{error}</div>
      )}

      {loading ? (
        <div className="d-flex justify-content-center my-4">
          <span>Loading...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="alert alert-info my-4">No users found.</div>
      ) : (
        users.map((user) => {
          console.log('User:', user);
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

      {/* Pagination Controls */}
      <div className="pagination-controls d-flex justify-content-between my-4">
        <button 
          className="btn btn-primary" 
          onClick={handlePreviousPage} 
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button 
          className="btn btn-primary" 
          onClick={handleNextPage} 
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserList;

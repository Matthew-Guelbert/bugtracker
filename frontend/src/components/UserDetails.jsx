import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const UserDetails = ({ auth, showError }) => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });
        setUser(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load user data';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, auth.token, showError]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="page-shell user-details">
      <div className="detail-shell">
        <div className="page-header mb-3">
          <h2 className="page-title">User Details</h2>
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="detail-item">
            <span className="label">Name</span>
            <span>{user.givenName} {user.familyName}</span>
          </div>
          <div className="detail-item">
            <span className="label">Role</span>
            <span>{user.role}</span>
          </div>
        </div>
        <div className="actions-row mt-4">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
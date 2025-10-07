import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const UserDetails = ({ auth, showError, showSuccess }) => {
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
        showSuccess('User data loaded successfully.');
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load user data';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, auth.token, showError, showSuccess]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="user-details">
      <h2>User Details</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Name:</strong> {user.givenName} {user.familyName}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default UserDetails;
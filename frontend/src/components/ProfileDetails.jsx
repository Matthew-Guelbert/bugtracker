import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';

const ProfileDetails = ({ auth, showError }) => {
  const { profile, setProfile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setProfile(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load profile';
      showError(errorMessage);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [auth.token]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchProfile();
    }
  }, [location.state]);

  if (!profile) {
    return <p>Loading...</p>;
  }

  return (
    <div className="page-shell profile-details">
      <div className="detail-shell">
        <div className="page-header mb-3">
          <h2 className="page-title">Profile</h2>
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">Name</span>
            <span>{profile.givenName} {profile.familyName}</span>
          </div>
          <div className="detail-item">
            <span className="label">Email</span>
            <span>{profile.email}</span>
          </div>
          <div className="detail-item">
            <span className="label">Role</span>
            <span>{Array.isArray(profile.role) ? profile.role.join(', ') : 'No roles assigned'}</span>
          </div>
        </div>
        <div className="actions-row mt-4">
          <button className="btn btn-primary" onClick={() => navigate('/profile/edit')}>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;

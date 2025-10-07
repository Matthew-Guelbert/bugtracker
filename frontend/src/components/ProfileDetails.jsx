import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';

const ProfileDetails = ({ auth, showError, showSuccess }) => {
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
      showSuccess('Profile loaded successfully.');
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
    <div className="profile-details">
      <h2>Profile Details</h2>
      <div>
        <p><strong>Name:</strong> {profile.givenName} {profile.familyName}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> {Array.isArray(profile.role) ? profile.role.join(', ') : 'No roles assigned'}</p>
      </div>
      <button className="btn btn-primary mt-3" onClick={() => navigate('/profile/edit')}>
        Edit Profile
      </button>
    </div>
  );
};

export default ProfileDetails;

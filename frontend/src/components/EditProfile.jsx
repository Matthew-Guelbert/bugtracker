import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';

const EditProfile = ({ auth, showError, showSuccess }) => {
  const { profile, setProfile } = useUserProfile();
  const [formData, setFormData] = useState({ givenName: '', familyName: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setLoading(false);
    } else {
      const fetchProfile = async () => {
        try {
          const response = await axios.get('/api/users/me', {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          });
          setProfile(response.data);
          setFormData(response.data);
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Failed to load profile';
          setError(errorMessage);
          showError(errorMessage);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [auth.token, profile, setProfile, showError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updates = {};
      if (formData.givenName) updates.givenName = formData.givenName;
      if (formData.familyName) updates.familyName = formData.familyName;
      if (formData.email) updates.email = formData.email;
      if (formData.password) updates.password = formData.password;

      const response = await axios.patch('/api/users/me', updates, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setProfile(response.data.user);
      showSuccess('Profile updated successfully.');
      navigate('/profile', { state: { refresh: true } });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="page-shell edit-profile">
      <div className="form-shell">
      <div className="page-header mb-3">
        <h2 className="page-title">Edit Profile</h2>
      </div>
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="mb-3">
          <label htmlFor="givenName" className="form-label">Given Name</label>
          <input
            type="text"
            id="givenName"
            name="givenName"
            className="form-control"
            value={formData.givenName}
            onChange={handleInputChange}
            required
          />
          <div className="invalid-feedback">
            Please enter your given name.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="familyName" className="form-label">Family Name</label>
          <input
            type="text"
            id="familyName"
            name="familyName"
            className="form-control"
            value={formData.familyName}
            onChange={handleInputChange}
            required
          />
          <div className="invalid-feedback">
            Please enter your family name.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <div className="invalid-feedback">
            Please enter a valid email address.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">New Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleInputChange}
          />
          <div className="invalid-feedback">
            Please enter a valid password.
          </div>
        </div>
        <div className="form-actions mt-3">
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default EditProfile;
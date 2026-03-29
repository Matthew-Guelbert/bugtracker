import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const UserEditor = ({ auth, showError, showSuccess }) => {
  const { userId } = useParams();
  const [user, setUser] = useState({
    email: '',
    password: '',
    givenName: '',
    familyName: '',
    role: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const roles = ['Admin', 'User', 'Developer', 'Quality Analyst', 'Business Analyst', 'Product Manager', 'Technical Manager'];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });
        setUser({
          email: response.data.email,
          givenName: response.data.givenName,
          familyName: response.data.familyName,
          role: response.data.role
        });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(`/api/users/${userId}`, user, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      showSuccess('User data updated successfully.');
      navigate(`/users/${userId}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update user data';
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
    <div className="page-shell user-editor">
      <form onSubmit={handleSubmit} className="form-shell">
      <div className="page-header mb-3">
        <h2 className="page-title">Edit User</h2>
      </div>
      <div className="mb-3">
        <label htmlFor='email' className="form-label">Email</label>
        <input
          type='email'
          id='email'
          name='email'
          className='form-control'
          value={user.email}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor='password' className="form-label">Password (Leave empty to keep the same)</label>
        <input
          type='password'
          id='password'
          name='password'
          className='form-control'
          value={user.password}
          onChange={handleInputChange}
        />
      </div>
      <div className="mb-3">
        <label htmlFor='givenName' className="form-label">Given Name</label>
        <input
          type='text'
          id='givenName'
          name='givenName'
          className='form-control'
          value={user.givenName}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor='familyName' className="form-label">Family Name</label>
        <input
          type='text'
          id='familyName'
          name='familyName'
          className='form-control'
          value={user.familyName}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor='role' className="form-label">Role</label>
        <select
          id='role'
          name='role'
          className='form-select'
          value={user.role}
          onChange={handleInputChange}
          required
        >
          {roles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      <div className="form-actions mt-3">
        <button type='submit' className='btn btn-primary'>Save Changes</button>
        <button type='button' className='btn btn-secondary' onClick={() => navigate(-1)}>Cancel</button>
      </div>
      </form>
    </div>
  );
};

export default UserEditor;

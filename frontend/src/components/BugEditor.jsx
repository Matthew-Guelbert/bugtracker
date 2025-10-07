import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';

const BugEditor = ({ auth, showError, showSuccess }) => {
  const { bugId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState('');
  const [assignedToUserName, setAssignedToUserName] = useState('');
  const [closed, setClosed] = useState(false);
  const [users, setUsers] = useState([]);
  
  // Change tracking
  const [touchedFields, setTouchedFields] = useState({});

  const classifications = ['Approved', 'Unapproved', 'Duplicate', 'Unclassified'];

  useEffect(() => {
    const fetchBugDetails = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`/api/bugs/${bugId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Bug response:', response.data);
        const bugData = response.data;
        setBug(bugData);
        setTitle(bugData.title || '');
        setDescription(bugData.description || '');
        setClassification(bugData.classification || 'Unclassified');
        setAssignedToUserName(bugData.assignedToUserName || '');
        setClosed(bugData.closed || false);
      } catch (err) {
        console.error('Error fetching bug details:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load bug details';
        setError(errorMessage);
        showError(errorMessage);
      }
    };

    const fetchAllUsers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        let allUsers = [];
        let currentPage = 1;
        let totalPages = 1;

        while (currentPage <= totalPages) {
          const response = await axios.get('/api/users', {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: currentPage, pageSize: 100 }, // Adjust pageSize as needed
          });
          console.log(`Users response page ${currentPage}:`, response.data);
          allUsers = allUsers.concat(response.data.users);
          totalPages = response.data.totalPages;
          currentPage++;
        }

        // Filter users based on roles
        const filteredUsers = allUsers.filter(user => 
          user.role.includes('Developer') || 
          user.role.includes('Business Analyst') || 
          user.role.includes('Quality Analyst')
        );
        console.log('Filtered users:', filteredUsers);
        setUsers(filteredUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load users';
        setError(errorMessage);
        showError(errorMessage);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchBugDetails(), fetchAllUsers()]);
      setLoading(false);
    };

    fetchData();
  }, [bugId, showError]);

  const trackChange = (fieldName, value) => {
    setTouchedFields({ ...touchedFields, [fieldName]: true });
    return value;
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      const updateRequests = [];

      if (touchedFields.title || touchedFields.description) {
        updateRequests.push(
          axios.patch(
            `/api/bugs/${bugId}`,
            { title, description },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }

      if (touchedFields.classification) {
        updateRequests.push(
          axios.put(
            `/api/bugs/${bugId}/classify`,
            { classification },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }

      if (touchedFields.closed) {
        updateRequests.push(
          axios.patch(
            `/api/bugs/${bugId}/close`,
            { closed: closed.toString() },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }

      if (touchedFields.assignedToUserName) {
        const selectedUser = users.find(
          (user) => `${user.givenName} ${user.familyName}` === assignedToUserName
        );

        if (selectedUser) {
          updateRequests.push(
            axios.patch(
              `/api/bugs/${bugId}/assign`,
              {
                assignedToUserId: selectedUser._id,
                assignedToUserName: `${selectedUser.givenName} ${selectedUser.familyName}`,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          );
        }
      }

      if (updateRequests.length > 0) {
        await Promise.all(updateRequests);
        showSuccess('Bug updated successfully!');
      } else {
        showError('No changes detected.');
      }

      navigate('/bugs');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save changes';
      showError(errorMessage);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const isAdmin = profile.role.includes('Admin');
  const isBusinessAnalyst = profile.role.includes('Business Analyst');
  const isProductManager = profile.role.includes('Product Manager');
  const isAssignedToUser = profile.name === bug?.assignedToUserName;

  return (
    <form onSubmit={handleSaveChanges} className="bug-editor">
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(trackChange('title', e.target.value))}
          required
          disabled={!isAdmin && !isProductManager && !isAssignedToUser}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          id="description"
          name="description"
          className="form-control"
          value={description}
          onChange={(e) => setDescription(trackChange('description', e.target.value))}
          required
          disabled={!isAdmin && !isProductManager && !isAssignedToUser}
        />
      </div>

      {(isAdmin || profile.role.includes('Business Analyst')) && (
        <>
          <div className="mb-3">
            <label htmlFor="classification" className="form-label">Classification</label>
            <select
              id="classification"
              className="form-select"
              value={classification}
              onChange={(e) => setClassification(trackChange('classification', e.target.value))}
              disabled={!isAdmin && !isBusinessAnalyst}
            >
              {classifications.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="closed" className="form-label">Status</label>
            <select
              id="closed"
              className="form-select"
              value={closed ? 'Closed' : 'Open'}
              onChange={(e) => setClosed(trackChange('closed', e.target.value === 'Closed'))}
              disabled={!isAdmin && !isBusinessAnalyst}
            >
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </>
      )}

      <div className="mb-3">
        <label htmlFor="assignedToUserName" className="form-label">Assigned To</label>
        <select
          id="assignedToUserName"
          className="form-select"
          value={assignedToUserName}
          onChange={(e) => setAssignedToUserName(trackChange('assignedToUserName', e.target.value))}
          disabled={!isAdmin && !isProductManager && !isAssignedToUser}
        >
          <option value="">Unassigned</option>
          {Array.isArray(users) && users.map((user) => (
            <option key={user._id} value={`${user.givenName} ${user.familyName}`}>
              {user.givenName} {user.familyName} ({user.role})
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary">Save Changes</button>
      <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(-1)}>
        Go Back
      </button>
    </form>
  );
};

export default BugEditor;
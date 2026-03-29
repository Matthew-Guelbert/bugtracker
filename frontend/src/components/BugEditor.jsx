import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
        const response = await axios.get(`/api/bugs/${bugId}`);
        
        // Check if we got HTML instead of JSON (proxy issue)
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          throw new Error('Received HTML instead of JSON - API proxy not working');
        }
        
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
        let allUsers = [];
        let currentPage = 1;
        let totalPages = 1;

        while (currentPage <= totalPages) {
          const response = await axios.get('/api/users', {
            params: { pageNumber: currentPage, pageSize: 100 },
          });
          
          // Check if we got HTML instead of JSON (proxy issue)
          if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            throw new Error('Received HTML instead of JSON - API proxy not working');
          }
          
          if (!response.data || !response.data.users) {
            throw new Error('Invalid response format from users API');
          }
          
          allUsers = allUsers.concat(response.data.users);
          totalPages = response.data.totalPages;
          currentPage++;
        }

        const filteredUsers = allUsers.filter((user) => {
          const userRoles = Array.isArray(user.role) ? user.role : [user.role];
          return userRoles.some((role) =>
            role === 'Developer' ||
            role === 'Business Analyst' ||
            role === 'Quality Analyst'
          );
        });
        setUsers(filteredUsers);
      } catch (err) {
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
  }, [bugId, showError, auth]);

  const trackChange = (fieldName, value) => {
    setTouchedFields({ ...touchedFields, [fieldName]: true });
    return value;
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    // Frontend validation
    if (!title.trim()) {
      showError('Title is required and cannot be empty.');
      return;
    }

    if (!description.trim()) {
      showError('Description is required and cannot be empty.');
      return;
    }

    if (classification && !['Approved', 'Unapproved', 'Duplicate', 'Unclassified'].includes(classification)) {
      showError('Please select a valid classification.');
      return;
    }

    try {
      const updateRequests = [];

      if (touchedFields.title || touchedFields.description || touchedFields.stepsToReproduce) {
        updateRequests.push(
          axios.patch(`/api/bugs/${bugId}`, {
            title,
            description,
            stepsToReproduce: bug?.stepsToReproduce || ''
          })
        );
      }

      if (touchedFields.classification) {
        updateRequests.push(
          axios.put(`/api/bugs/${bugId}/classify`, { classification })
        );
      }

      if (touchedFields.closed) {
        updateRequests.push(
          axios.patch(`/api/bugs/${bugId}/close`, { closed: closed.toString() })
        );
      }

      if (touchedFields.assignedToUserName) {
        const selectedUser = users.find(
          (user) => `${user.givenName} ${user.familyName}` === assignedToUserName
        );

        if (selectedUser) {
          updateRequests.push(
            axios.patch(`/api/bugs/${bugId}/assign`, {
              assignedToUserId: selectedUser._id,
              assignedToUserName: `${selectedUser.givenName} ${selectedUser.familyName}`,
            })
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

  // Use profile from context, fallback to auth prop
  const userProfile = profile || auth;
  
  // Safety checks for profile and role
  const profileRoles = userProfile?.role ? (Array.isArray(userProfile.role) ? userProfile.role : [userProfile.role]) : [];
  const isAdmin = profileRoles.includes('Admin');
  const isBusinessAnalyst = profileRoles.includes('Business Analyst');
  const isProductManager = profileRoles.includes('Product Manager');
  const isAssignedToUser = userProfile?.name === bug?.assignedToUserName;

  const canEdit = isAdmin || isProductManager || isAssignedToUser;
  const canClassify = isAdmin || isBusinessAnalyst;

  return (
    <div className="page-shell bug-editor">
    <form onSubmit={handleSaveChanges} className="form-shell">
      <div className="page-header mb-3">
        <h2 className="page-title">Edit Bug</h2>
      </div>
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
          disabled={!canEdit}
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
          disabled={!canEdit}
        />
      </div>

      {canClassify && (
        <>
          <div className="mb-3">
            <label htmlFor="classification" className="form-label">Classification</label>
            <select
              id="classification"
              className="form-select"
              value={classification}
              onChange={(e) => setClassification(trackChange('classification', e.target.value))}
              disabled={!canClassify}
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
              disabled={!canClassify}
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
          disabled={!canEdit}
        >
          <option value="">Unassigned</option>
          {Array.isArray(users) && users.map((user) => {
            if (!user || !user._id || !user.givenName || !user.familyName) {
              console.warn('Invalid user object:', user);
              return null;
            }
            return (
              <option key={user._id} value={`${user.givenName} ${user.familyName}`}>
                {user.givenName} {user.familyName} ({user.role || 'No role'})
              </option>
            );
          })}
        </select>
      </div>

      <div className="form-actions mt-3">
        <button type="submit" className="btn btn-primary">Save Changes</button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </form>
    </div>
  );
};

BugEditor.propTypes = {
  auth: PropTypes.shape({
    token: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  }),
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
};

export default BugEditor;
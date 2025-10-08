import { useNavigate, NavLink } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';
import './LandingPage.css';

const LandingPage = () => {
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  console.log('Profile in LandingPage:', profile); // Log the profile data

  const renderRoleSpecificButtons = () => {
    if (!profile || !profile.role) return null;

    const roleButtons = [];

    const isAdmin = profile.role.includes('Admin');

    if (isAdmin) {
      roleButtons.push(
        <button key="manage-users" onClick={() => navigate('/users')} className="cta-button">
          Manage Users
        </button>
      );
    }

    return roleButtons;
  };

  return (
    <div className="landing-page">
      <div className="landing-header">
        <h1>
          Welcome back, {profile ? profile.name : 'User'}!
        </h1>
        <h2>Your Dashboard</h2>
        <p>
          Your central hub for bug tracking, issue reporting, and task
          management.
        </p>
      </div>

      <div className="landing-actions">
        {renderRoleSpecificButtons()}
        <button className="btn btn-primary">
          <NavLink to="/bugs" className="text-white text-decoration-none">
            View All Bugs
          </NavLink>
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/my-bugs')}>View My Bugs</button>
      </div>
    </div>
  );
};

export default LandingPage;

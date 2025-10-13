import { useNavigate, NavLink } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';
import './LandingPage.css';

const LandingPage = () => {
  const { profile } = useUserProfile();
  const navigate = useNavigate();


  // Only log the profile object, not React elements
  if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
    // Uncomment for debugging:
    // console.log('Profile in LandingPage:', profile);
  }

  const renderRoleSpecificButtons = () => {
    if (!profile || !profile.role) return null;
    const isAdmin = profile.role.includes('Admin');
    return (
      <>
        {isAdmin && (
          <button key="manage-users" onClick={() => navigate('/users')} className="btn-gradient-primary">
            Manage Users
          </button>
        )}
      </>
    );
  };

  return (
    <div className="landing-page bg-light min-vh-100 py-5">
      {/* Hero Section */}
      <section className="container mb-5">
        <div className="row justify-content-center align-items-center">
          <div className="col-12 col-md-8 text-center">
            <h1 className="display-4 fw-bold mb-3">
              Welcome back, <span className="text-primary">{profile ? profile.name : 'User'}</span>!
            </h1>
            <h2 className="h4 text-muted mb-4">Your Bug Tracker Dashboard</h2>
            <p className="lead mb-4">
              Track, report, and resolve bugs efficiently. Stay on top of your team&apos;s progress and collaborate seamlessly.
            </p>
            <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 mb-3">
              <button 
                className="btn-gradient-primary btn-lg shadow px-4" 
                onClick={() => navigate('/bugs')}
                style={{ 
                  background: 'linear-gradient(90deg, #0052cc 0%, #2684ff 100%)', 
                  color: '#fff', 
                  border: 'none' 
                }}
              >
                <i className="bi bi-bug-fill me-2"></i>View All Bugs
              </button>
              <button className="btn-gradient-outline btn-lg shadow px-4" onClick={() => navigate('/my-bugs')}>
                <i className="bi bi-person-lines-fill me-2"></i>View My Bugs
              </button>
              {renderRoleSpecificButtons()}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center">
                <i className="bi bi-clipboard-data fs-1 text-primary mb-3"></i>
                <h5 className="card-title">Bug Analytics</h5>
                <p className="card-text text-muted">Visualize bug trends, monitor open/closed issues, and gain insights into your team's workflow.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center">
                <i className="bi bi-people-fill fs-1 text-primary mb-3"></i>
                <h5 className="card-title">Team Collaboration</h5>
                <p className="card-text text-muted">Assign bugs, leave comments, and work together to resolve issues faster and more effectively.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center">
                <i className="bi bi-shield-check fs-1 text-primary mb-3"></i>
                <h5 className="card-title">Secure & Reliable</h5>
                <p className="card-text text-muted">Your data is protected with robust authentication and role-based access control.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

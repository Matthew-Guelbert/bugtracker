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
          <button key="manage-users" onClick={() => navigate('/users')} className="btn btn-secondary btn-lg px-4">
            <i className="bi bi-people-fill me-2"></i>Manage Users
          </button>
        )}
      </>
    );
  };

  return (
    <div className="landing-page min-vh-100 py-4 py-md-5">
      <section className="container mb-5">
        <div className="landing-hero text-center text-md-start">
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-8">
              <p className="text-uppercase fw-semibold small mb-2 text-muted">Issue Tracking Workspace</p>
              <h1 className="display-5 mb-3">
                Welcome back, <span className="text-primary">{profile?.givenName || profile?.name || 'User'}</span>
              </h1>
              <p className="lead mb-4 text-muted">
                Keep defects visible, prioritize what matters, and ship fixes with confidence.
              </p>
              <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 gap-md-3">
                <button className="btn btn-primary btn-lg px-4" onClick={() => navigate('/bugs')}>
                  <i className="bi bi-bug-fill me-2"></i>Browse Bugs
                </button>
                <button className="btn btn-secondary btn-lg px-4" onClick={() => navigate('/my-bugs')}>
                  <i className="bi bi-person-lines-fill me-2"></i>My Queue
                </button>
                {renderRoleSpecificButtons()}
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="feature-panel text-start">
                <h5 className="mb-2">Today&apos;s focus</h5>
                <p className="mb-0 text-muted">
                  Review critical bugs first, then triage unassigned issues to keep the backlog healthy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="row g-3 g-md-4">
          <div className="col-md-4">
            <div className="feature-panel">
              <i className="bi bi-speedometer2 fs-3 text-primary"></i>
              <h5 className="mt-3">Fast Triage</h5>
              <p className="mb-0 text-muted">Quickly filter by status, severity, and ownership to reduce response time.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-panel">
              <i className="bi bi-people fs-3 text-primary"></i>
              <h5 className="mt-3">Clear Ownership</h5>
              <p className="mb-0 text-muted">Assign work transparently and keep progress visible for every team member.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-panel">
              <i className="bi bi-shield-check fs-3 text-primary"></i>
              <h5 className="mt-3">Controlled Access</h5>
              <p className="mb-0 text-muted">Role-based permissions keep critical workflows safe and predictable.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.PNG';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useUserProfile } from '../contexts/UserProfileContext';

const Navbar = ({ auth, onLogout }) => {
  const { profile } = useUserProfile();

  // Handle logout by preventing the default behavior and calling onLogout function
  const onClickLogout = (evt) => {
    evt.preventDefault();
    onLogout();
  };

  return (
    <header>
      <nav className='navbar navbar-expand-lg app-navbar'>
        <div className='container'>
          <NavLink className='navbar-brand' to={auth ? '/landing' : '/login'}>
            <img
              src={logo}
              alt='Issue Tracker logo'
              style={{ height: '48px', width: 'auto' }}
            />
            <span>BugTracker</span>
          </NavLink>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className='navbar-nav ms-auto align-items-lg-center gap-lg-2'>
              {!auth && (
                <>
                  <li className='nav-item'>
                    <NavLink className='nav-link' to='/login'>
                      Log in
                    </NavLink>
                  </li>
                  <li className='nav-item'>
                    <NavLink className='nav-link' to='/register'>
                      Register
                    </NavLink>
                  </li>
                </>
              )}

              {auth && (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/landing">
                      Home
                    </NavLink>
                  </li>
                  <li className='nav-item'>
                    <NavLink className='nav-link' to='/bugs'>
                      Bugs
                    </NavLink>
                  </li>
                  <li className='nav-item'>
                    <NavLink className='nav-link' to='/users'>
                      Users
                    </NavLink>
                  </li>
                  <li className='nav-item dropdown'>
                    <a
                      className='nav-link dropdown-toggle'
                      href='#'
                      id='navbarDropdown'
                      role='button'
                      data-bs-toggle='dropdown'
                      aria-expanded='false'
                    >
                      {profile?.givenName || profile?.name || 'Account'}
                    </a>
                    <ul className='dropdown-menu dropdown-menu-end' aria-labelledby='navbarDropdown'>
                      <li>
                        <NavLink className='dropdown-item' to='/profile'>
                          Profile settings
                        </NavLink>
                      </li>
                      <li>
                        <a className='dropdown-item' href='#' onClick={onClickLogout}>
                          Log out
                        </a>
                      </li>
                    </ul>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

Navbar.propTypes = {
  auth: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
};

export default Navbar;

import React from 'react';
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
      <nav className='navbar navbar-expand-lg navbar-dark bg-dark'>
        <div className='container'>
          {/* Logo */}
          <a className='navbar-brand' href='/'>
            <img
              src={logo}
              alt='Issue Tracker logo'
              style={{ height: '70px', width: 'auto', marginRight: '10px' }}
            />
          </a>

          {/* Navbar Links */}
          <ul className='navbar-nav ml-auto'>
            {/* Show Login and Register if not logged in */}
            {!auth && (
              <>
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/login'>
                    LOGIN
                  </NavLink>
                </li>
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/register'>
                    REGISTER
                  </NavLink>
                </li>
              </>
            )}

            {/* Show main links if logged in */}
            {auth && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/landing">
                    HOME
                  </NavLink>
                </li>
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/bugs'>
                    BUGS
                  </NavLink>
                </li>
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/users'>
                    USERS
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
                    {profile ? profile.name : 'User'}
                  </a>
                  <ul className='dropdown-menu' aria-labelledby='navbarDropdown'>
                    <li>
                      <NavLink className='dropdown-item' to='/profile'>
                        Profile Settings
                      </NavLink>
                    </li>
                    <li>
                      <a className='dropdown-item' href='#' onClick={onClickLogout}>
                        Logout
                      </a>
                    </li>
                  </ul>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

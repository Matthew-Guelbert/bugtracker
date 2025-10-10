import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterForm.css';

const RegisterForm = ({ showError, showSuccess }) => {
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  // Removed unused success and error state

  const navigate = useNavigate();

  useEffect(() => {
    // Apply Bootstrap validation to the form
    (() => {
      'use strict';

      const forms = document.querySelectorAll('.needs-validation');

      Array.from(forms).forEach((form) => {
        form.addEventListener(
          'submit',
          (event) => {
            if (!form.checkValidity()) {
              event.preventDefault();
              event.stopPropagation();
            }

            form.classList.add('was-validated');
          },
          false
        );
      });
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validation for fields
    if (!email.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }
  
    if (email.trim() !== emailConfirm.trim()) {
      showError('Email addresses do not match.');
      return;
    }
  
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
  
    if (password !== passwordConfirm) {
      showError('Passwords do not match.');
      return;
    }
  
    if (!givenName || !familyName) {
      showError('Given name and Family name are required.');
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        email,
        password,
        givenName,
        familyName,
      });
  
      if (response.status === 201) {
        showSuccess('Registration successful! Redirecting to login...');
        navigate('/login'); // Redirect to login page
      }
    } catch (err) {
      // Handle errors properly
      if (err.response) {
        showError(err.response.data.message || 'Registration failed.');
      } else if (err.request) {
        showError('No response from the server. Please try again later.');
      } else {
        showError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  return (
    <div className="register-container gradient-bg">
      <div className="register-box glass-card shadow-lg">
        <h2 className="register-title mb-4">Create Your Account</h2>
        <form
          className="register-form needs-validation"
          noValidate
          onSubmit={handleSubmit}
        >
          {/* Given Name */}
          <div className="mb-3 position-relative">
            <i className="bi bi-person position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none', fontSize: '1.1rem' }}></i>
            <input
              type="text"
              id="givenName"
              className="form-control ps-5"
              placeholder="Given Name"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              required
            />
            <div className="invalid-feedback">Please enter your given name.</div>
          </div>

          {/* Family Name */}
          <div className="mb-3 position-relative">
            <i className="bi bi-person position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none', fontSize: '1.1rem' }}></i>
            <input
              type="text"
              id="familyName"
              className="form-control ps-5"
              placeholder="Family Name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
            />
            <div className="invalid-feedback">Please enter your family name.</div>
          </div>

          {/* Email */}
          <div className="mb-3 position-relative">
            <i className="bi bi-envelope position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none', fontSize: '1.1rem' }}></i>
            <input
              type="email"
              id="email"
              className="form-control ps-5"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="invalid-feedback">Please enter a valid email address.</div>
          </div>

          {/* Confirm Email */}
          <div className="mb-3 position-relative">
            <i className="bi bi-envelope-check position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none', fontSize: '1.1rem' }}></i>
            <input
              type="email"
              id="emailConfirm"
              className="form-control ps-5"
              placeholder="Confirm Email address"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              required
            />
            <div className="invalid-feedback">Please confirm your email address.</div>
          </div>

          {/* Password */}
          <div className="mb-3 position-relative">
            <i className="bi bi-lock position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none', fontSize: '1.1rem' }}></i>
            <input
              type="password"
              id="password"
              className="form-control ps-5"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
            <div className="invalid-feedback">Please enter a password with at least 6 characters.</div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3 position-relative">
            <i className="bi bi-lock-fill position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none', fontSize: '1.1rem' }}></i>
            <input
              type="password"
              id="passwordConfirm"
              className="form-control ps-5"
              placeholder="Confirm Password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
            <div className="invalid-feedback">Please confirm your password.</div>
          </div>

          <button type="submit" className="btn btn-gradient-primary w-100 py-2 mt-2 shadow-sm">
            <i className="bi bi-person-plus me-2"></i>Register
          </button>

          {/* Success or error message (handled by parent via showSuccess/showError) */}
        </form>

        {/* Link to login page */}
        <div className="mt-3 text-center">
          <Link to="/login" className="text-decoration-none">Already have an account? <span className="fw-semibold">Login</span></Link>
        </div>
      </div>
    </div>
  );
};


RegisterForm.propTypes = {
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
};

export default RegisterForm;

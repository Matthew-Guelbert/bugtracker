import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterForm.css';

const RegisterForm = ({ onRegister, showError, showSuccess }) => {
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

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
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-title">Register</h2>
        <form
          className="register-form needs-validation"
          noValidate
          onSubmit={handleSubmit}
        >
          {/* Given Name */}
          <div className="mb-3">
            <label htmlFor="givenName" className="form-label">
              Given Name
            </label>
            <input
              type="text"
              id="givenName"
              className="form-control"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              required
            />
            <div className="invalid-feedback">
              Please enter your given name.
            </div>
          </div>

          {/* Family Name */}
          <div className="mb-3">
            <label htmlFor="familyName" className="form-label">
              Family Name
            </label>
            <input
              type="text"
              id="familyName"
              className="form-control"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
            />
            <div className="invalid-feedback">
              Please enter your family name.
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="invalid-feedback">
              Please enter a valid email address.
            </div>
          </div>

          {/* Confirm Email */}
          <div className="mb-3">
            <label htmlFor="emailConfirm" className="form-label">
              Confirm Email address
            </label>
            <input
              type="email"
              id="emailConfirm"
              className="form-control"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              required
            />
            <div className="invalid-feedback">
              Please confirm your email address.
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
            <div className="invalid-feedback">
              Please enter a password with at least 6 characters.
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label htmlFor="passwordConfirm" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="passwordConfirm"
              className="form-control"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
            <div className="invalid-feedback">
              Please confirm your password.
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Register
          </button>

          {/* Success or error message */}
          {success && <div className="alert alert-success mt-3">{success}</div>}
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </form>

        {/* Link to login page */}
        <div className="mt-3 text-center">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;

'use client';

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../contexts/UserProfileContext';
import './LoginForm.css';

const LoginForm = ({ onLogin, showError, showSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailValid, setEmailValid] = useState(true);
  const [isPasswordValid, setPasswordValid] = useState(true);
  const { setProfile } = useUserProfile();

  useEffect(() => {
    (() => {
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation for email and password before sending the request
    let emailValid = true;
    let passwordValid = true;

    // Email validation
    if (!email.includes('@')) {
      emailValid = false;
      setEmailValid(false);
    }

    // Password validation (now 6 characters minimum)
    if (password.length < 6) {
      passwordValid = false;
      setPasswordValid(false);
    }

    // If either validation fails, prevent form submission
    if (!emailValid || !passwordValid) {
      return;
    }

    // Send POST request if inputs are valid
    axios
      .post(
        'http://localhost:5000/api/users/login',
        { email, password },
        {
          withCredentials: true,
          validateStatus: (status) => status < 500,
        }
      )
      .then((res) => {
        if (res.status === 200) {
          setProfile(res.data); // Set the profile data in context
          onLogin(res.data);
          showSuccess(res.data.message);
        }
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          const errorMessage =
            err.response.data.message || 'Invalid email or password';
          showError(errorMessage);
          toast.error(errorMessage);
        } else {
          const genericError = 'An error occurred. Please try again.';
          showError(genericError);
          toast.error(genericError);
        }
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div
        className="card shadow-lg border-0"
        style={{ maxWidth: '420px', width: '100%' }}
      >
        <div className="card-body p-5">
          <h2 className="text-center mb-2 fw-bold">Welcome Back</h2>
          <p className="text-center text-muted mb-4">Sign in to your account</p>

          <form className="needs-validation" noValidate onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label fw-medium">
                Email Address
              </label>
              <div className="input-group has-validation">
                <span className="input-group-text">
                  <i className="bi bi-envelope-fill text-muted"></i>
                </span>
                <input
                  type="email"
                  className={`form-control ${isEmailValid ? '' : 'is-invalid'}`}
                  id="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="invalid-feedback">
                  Please enter a valid email address.
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-medium">
                Password
              </label>
              <div className="input-group has-validation">
                <span className="input-group-text">
                  <i className="bi bi-lock-fill text-muted"></i>
                </span>
                <input
                  type="password"
                  className={`form-control ${
                    isPasswordValid ? '' : 'is-invalid'
                  }`}
                  id="password"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="invalid-feedback">
                  Please enter a valid password with a minimum of 6 characters.
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-medium mb-4"
            >
              Sign In
            </button>

            <div className="text-center pt-3 border-top">
              <p className="text-muted mb-0">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-decoration-none fw-medium">
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

LoginForm.propTypes = {
  onLogin: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
};

export default LoginForm;

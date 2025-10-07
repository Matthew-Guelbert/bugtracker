import { useState, useEffect } from 'react';
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
      .post('http://localhost:5000/api/users/login', { email, password }, {
        withCredentials: true,
        validateStatus: (status) => status < 500,
      })
      .then((res) => {
        if (res.status === 200) {
          setProfile(res.data); // Set the profile data in context
          onLogin(res.data);
          showSuccess(res.data.message);
        }
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          const errorMessage = err.response.data.message || 'Invalid email or password';
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
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Login</h2>
        <form
          className="login-form needs-validation"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-group">
              <span className="input-group-text" id="email-addon">
                <i className="bi bi-envelope-fill input-icon"></i>
              </span>
              <input
                type="email"
                className={`form-control input-field ${isEmailValid ? '' : 'is-invalid'}`}
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="invalid-feedback">
                Please enter a valid email address.
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text" id="password-addon">
                <i className="bi bi-lock-fill input-icon"></i>
              </span>
              <input
                type="password"
                className={`form-control input-field ${isPasswordValid ? '' : 'is-invalid'}`}
                id="password"
                required
                minLength={6}  // Updated password length requirement
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="invalid-feedback">
                Please enter a valid password with a minimum of 6 characters.
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Login
          </button>
          <div className="mt-3">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

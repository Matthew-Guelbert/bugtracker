import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { UserProfileProvider, useUserProfile } from './contexts/UserProfileContext';

import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import ProfileDetails from './components/ProfileDetails';
import EditProfile from './components/EditProfile';
import BugList from './components/BugList';
import BugEditor from './components/BugEditor';
import UserList from './components/UserList';
import UserEditor from './components/UserEditor';
import AddBug from './components/AddBug';
import BugDetails from './components/BugDetails';
import AddComment from './components/AddComment';
import UserDetails from './components/UserDetails';
import AddTest from './components/AddTest';
import CaseDetails from './components/CaseDetails';
import LogHours from './components/LogHours';
import ViewLogs from './components/ViewLogs';
import EditTestCase from './components/EditTestCase';
import MyBugList from './components/MyBugList'; // Ensure this component exists

const App = () => {
  const [auth, setAuth] = useState(null);
  const navigate = useNavigate();
  const { setProfile } = useUserProfile();

  useEffect(() => {
    // Set up axios interceptor to automatically add the Authorization header
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        // Handle errors globally
        console.error('Error in Axios interceptor:', error);
        return Promise.reject(error);
      }
    );

    // Retrieve token from localStorage and set auth state
    const token = localStorage.getItem('authToken');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      setAuth({ token, ...user });
      setProfile(user);
    }

    // Clean up on unmount
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [setProfile]);

  const onLogin = (auth) => {
    setAuth(auth);
    setProfile(auth); // Set the profile data in context
    localStorage.setItem('authToken', auth.token);
    localStorage.setItem('user', JSON.stringify(auth));
    navigate('/landing');
    showSuccess('Login successful');
  };

  const onRegister = (auth) => {
    setAuth(auth);
    setProfile(auth); // Set the profile data in context
    localStorage.setItem('authToken', auth.token);
    localStorage.setItem('user', JSON.stringify(auth));
    navigate('/landing');
    showSuccess('Registration successful');
  };

  const onLogout = () => {
    setAuth(null);
    setProfile(null); // Clear the profile data in context
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
    showSuccess('User has been logged out');
  };

  const showError = useCallback((message) => {
    toast(message, { type: 'error', position: 'bottom-right' });
  }, []);

  const showSuccess = useCallback((message) => {
    toast(message, { type: 'success', position: 'bottom-right' });
  }, []);

  return (
    <div className="App">
      <Navbar auth={auth} onLogout={onLogout} />
      <ToastContainer />
      <main className="container my-5">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginForm onLogin={onLogin} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/register" element={<RegisterForm onRegister={onRegister} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/landing" element={<LandingPage auth={auth} />} />
          <Route path="/profile" element={<ProfileDetails auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/profile/edit" element={<EditProfile auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs" element={<BugList auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/:bugId" element={<BugDetails auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/:bugId/add-comment" element={<AddComment auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/:bugId/edit" element={<BugEditor auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/add" element={<AddBug auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/:bugId/add-test" element={<AddTest auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/:bugId/test-cases" element={<CaseDetails auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/:bugId/log-hours" element={<LogHours auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/:bugId/logs" element={<ViewLogs auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/bugs/:bugId/tests/:testId/edit" element={<EditTestCase auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/my-bugs" element={<MyBugList auth={auth} showError={showError} showSuccess={showSuccess} />} /> {/* Ensure this route exists */}
          <Route path="/users" element={<UserList auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/users/:userId" element={<UserDetails auth={auth} showError={showError} showSuccess={showSuccess} />} />
          <Route path="/users/:userId/edit" element={<UserEditor auth={auth} showError={showError} showSuccess={showSuccess} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
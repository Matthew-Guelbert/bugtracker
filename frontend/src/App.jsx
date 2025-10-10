import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { isTokenExpired } from './utils/auth';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { useUserProfile } from './contexts/UserProfileContext';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const { setProfile } = useUserProfile();

  useEffect(() => {
    // Set up axios interceptor to automatically add the Authorization header and handle 401 globally
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid, force logout
          setAuth(null);
          setProfile(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          navigate('/login');
          toast('Session expired. Please log in again.', { type: 'error', position: 'bottom-right' });
        }
        return Promise.reject(error);
      }
    );

    // Initialize auth state from localStorage and refresh profile from backend if token is valid
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userString = localStorage.getItem('user');
      if (token && userString) {
        if (isTokenExpired(token)) {
          setAuth(null);
          setProfile(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setIsInitialized(true);
          return;
        }
        try {
          const user = JSON.parse(userString);
          const authData = { token, ...user };
          setAuth(authData);
          setProfile(authData);
          // Try to refresh profile from backend
          try {
            const res = await axios.get('/api/users/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            setProfile({ ...authData, ...res.data });
          } catch (err) {
            // If 401, response interceptor will handle logout
            // Otherwise, just use local profile
          }
        } catch (error) {
          setAuth(null);
          setProfile(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();

    // Clean up on unmount
    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [setProfile, navigate]);

  const showError = useCallback((message) => {
    toast(message, { type: 'error', position: 'bottom-right' });
  }, []);

  const showSuccess = useCallback((message) => {
    toast(message, { type: 'success', position: 'bottom-right' });
  }, []);

  const onLogin = useCallback((authData) => {
    setAuth(authData);
    setProfile(authData);
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    navigate('/landing');
    showSuccess('Login successful');
  }, [navigate, setProfile, showSuccess]);

  const onRegister = useCallback((authData) => {
    setAuth(authData);
    setProfile(authData);
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    navigate('/landing');
    showSuccess('Registration successful');
  }, [navigate, setProfile, showSuccess]);

  const onLogout = useCallback(() => {
    setAuth(null);
    setProfile(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
    showSuccess('User has been logged out');
  }, [navigate, setProfile, showSuccess]);

  // Show loading spinner while initializing auth state
  if (!isInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar auth={auth} onLogout={onLogout} />
      <ToastContainer />
      <main className="container my-5">
        <Routes>
          <Route path="/" element={<Navigate to={auth ? "/landing" : "/login"} />} />
          <Route 
            path="/login" 
            element={auth ? <Navigate to="/landing" /> : <LoginForm onLogin={onLogin} showError={showError} showSuccess={showSuccess} />} 
          />
          <Route 
            path="/register" 
            element={auth ? <Navigate to="/landing" /> : <RegisterForm onRegister={onRegister} showError={showError} showSuccess={showSuccess} />} 
          />
          <Route 
            path="/landing" 
            element={auth ? <LandingPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={auth ? <ProfileDetails auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile/edit" 
            element={auth ? <EditProfile auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs" 
            element={auth ? <BugList auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/:bugId" 
            element={auth ? <BugDetails auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/:bugId/add-comment" 
            element={auth ? <AddComment auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/:bugId/edit" 
            element={auth ? <BugEditor auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/add" 
            element={auth ? <AddBug auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/:bugId/add-test" 
            element={auth ? <AddTest auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/:bugId/test-cases" 
            element={auth ? <CaseDetails auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/:bugId/log-hours" 
            element={auth ? <LogHours auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/:bugId/logs" 
            element={auth ? <ViewLogs auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/bugs/:bugId/tests/:testId/edit" 
            element={auth ? <EditTestCase auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/my-bugs" 
            element={auth ? <MyBugList auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/users" 
            element={auth ? <UserList auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/users/:userId" 
            element={auth ? <UserDetails auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/users/:userId/edit" 
            element={auth ? <UserEditor auth={auth} showError={showError} showSuccess={showSuccess} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
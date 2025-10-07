import React from 'react';
import { Link } from 'react-router-dom';

const ShowComponents = () => {
  return (
    <div>
      <h2>Show Off All Components</h2>
      <ul>
        <li><Link to="/">Login Form</Link></li>
        <li><Link to="/register">Register Form</Link></li>
        <li><Link to="/bugs">Bug List</Link></li>
        <li><Link to="/users">User List</Link></li>
      </ul>
    </div>
  );
};

export default ShowComponents;

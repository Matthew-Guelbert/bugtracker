# Bug Tracker

A full-stack bug tracking application built with the MERN stack (MongoDB, Express, React, Node.js). The application provides teams with a centralized platform to log, track, assign, and manage software issues throughout the development lifecycle.

## Features

- JWT-based user authentication with role-based access control
- Create, update, and resolve bug reports
- Assign bugs to users and track assignment history
- Filter bugs by status, priority, and assigned user
- Log work hours on bugs for time tracking
- Add test cases and comments to bugs for collaboration
- User management with configurable permissions

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT with @merlin4/express-auth
- **Validation**: Joi
- **Security**: Bcrypt for password hashing

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB running locally or a MongoDB Atlas connection string

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Matthew-Guelbert/bugtracker.git
cd bugtracker
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory with the following variables:
```
PORT=5000
DB_URL=your_mongodb_connection_string
DB_NAME=bugtracker
JWT_SECRET=your_jwt_secret
```

4. Start the backend server:
```bash
npm run start-dev
```

5. In a new terminal, start the frontend:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and the API will run on `http://localhost:5000`.

## Project Structure

```
/frontend          - React + Vite frontend application
/middleware        - Express middleware for authentication and validation
/routes            - API route definitions
/schema            - Joi validation schemas
database.js        - MongoDB connection and database operations
index.js           - Express application entry point
```

## License

This project is licensed under the MIT License.


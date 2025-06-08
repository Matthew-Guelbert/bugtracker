MERN Bug Tracker </br>
A full-stack bug tracking application built using the MERN stack (MongoDB, Express, React, Node.js). This project is designed to help teams log, track, and manage software issues throughout the development lifecycle.

Features:

User authentication (JWT-based)

Create, update, and resolve bug reports

Assign bugs to users

Filter bugs by status, priority, and assigned user

Dashboard overview (planned)

Clean UI built with Vite + React (UI revamp in progress)

Modular, maintainable API design

Getting Started:

1. Clone the repo:
git clone https://github.com/Matthew-Guelbert/bugtracker.git
cd bugtracker

2. Install backend dependencies:
npm install

3. Configure environment variables:
Create a .env file in the root directory with the following:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

4. Run the backend server:
npm run start-dev

5. Set up frontend (React + Vite):
cd frontend
npm install
npm run dev

Project Structure:

/frontend - React + Vite frontend
/middleware - Express middleware (auth, error handlers)
/routes - API route definitions
/schema - MongoDB models or schema logic
database.js - MongoDB connection logic
index.js - Express app entry point
.env - Environment config
.gitignore
LICENSE
README.md

Tech Stack:

Frontend: React + Vite

Backend: Node.js + Express

Database: MongoDB (native driver or Mongoose)

Authentication: JWT-based using @merlin4/express-auth

Other Tools: Joi, Bcrypt, Dotenv, Nodemon, Debug

License:
This project is licensed under the MIT License.

Author:
Matthew Guelbert
Portfolio: https://matthew-guelbert.github.io/
GitHub: https://github.com/Matthew-Guelbert


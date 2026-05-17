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
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://your-production-domain.com
```

For production, set `NODE_ENV=production` in your hosting environment and update `CORS_ORIGINS` to include the deployed frontend domain.

The frontend uses `frontend/.env.local` for local development and `frontend/.env.production` for production. Example values are included in `frontend/.env.example`.

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

## Environment Files

Example environment files are included to show the expected variables:

- `.env.example` for backend configuration
- `frontend/.env.example` for the frontend API URL

**Security note:** If sensitive values (like `JWT_SECRET` or DB credentials) are accidentally committed, rotate those secrets immediately. To remove a local `.env` file from the repository index without deleting it locally:

```bash
git rm --cached .env
git commit -m "Remove local .env from repo"
```

If secrets were pushed to the repository history, use a history-rewriting tool such as `git filter-repo` or the BFG Repo-Cleaner to purge them, then rotate credentials. Example (git filter-repo):

```bash
# Install git-filter-repo (follow official instructions)
git filter-repo --invert-paths --path .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

These commands rewrite history and will require force-pushing to shared remotes; coordinate with collaborators before running them.


## Deployment Checklist

Before hosting the application, verify the following:

- [ ] Set `DB_URL` and `DB_NAME` in the production backend environment
- [ ] Set `JWT_SECRET` in the production backend environment
- [ ] Set `CORS_ORIGINS` to the deployed frontend domain(s)
- [ ] Set `NODE_ENV=production` in the hosting environment
- [ ] Set `VITE_API_URL` to the production backend URL in the frontend environment
- [ ] Confirm the frontend builds successfully with `npm run build`
- [ ] Confirm backend tests pass with `npm test`
- [ ] Verify login, bug creation, editing, comments, and test case flows in the deployed app
- [ ] Confirm cookies and API requests work correctly in the production domain

## Deploying with Render (backend) + Vercel (frontend)

1. Deploy the backend to Render (or similar):
	- Create a new Web Service on Render and connect your GitHub repo.
	- In Render service settings, set these environment variables from `./.env.example`:
	  - `DB_URL`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS` (include your Vercel domain), `NODE_ENV=production`.
	- Ensure health checks are enabled and that TLS is active (Render provides HTTPS by default).

2. Note the backend HTTPS URL (e.g. `https://your-service.onrender.com`).

3. Configure Vercel (frontend):
	- In your Vercel project settings, set `VITE_API_URL` to the backend HTTPS URL.
	- For previews, add any preview domains you want to allow in `CORS_ORIGINS` on the backend.

4. Build & deploy flow:
	- Backend on Render will auto-deploy from your main branch (Run `npm start` script defined in `package.json`).
	- Frontend on Vercel will build with `npm run build` (Vite) and serve the static app.

5. Post-deploy checks:
	- Confirm login and protected routes work in the deployed frontend.
	- Confirm cookies are `httpOnly` and `secure` (set in production) and that auth flows complete.
	- Verify CORS errors do not appear in browser console and API requests succeed.

6. Troubleshooting notes:
	- If cookies are not being set, ensure `NODE_ENV=production` and that `app.set('trust proxy', 1)` is present in `index.js` (already added).
	- If you see CORS errors for preview builds, add the preview domain to `CORS_ORIGINS` temporarily.

These steps are minimal and aimed at a portfolio split-deploy: stable API on Render and static frontend on Vercel.

## License

This project is licensed under the MIT License.


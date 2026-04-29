# CivIQ2 - Setup & Installation Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud Atlas)
- npm or yarn

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory with:
```
MONGODB_URI=mongodb://localhost:27017/civictrack
JWT_SECRET=your_jwt_secret_key_change_this
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=sk-your-openai-key-here
```

**For MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civictrack
```

### 3. Populate Test Data (Optional)
Run the seed script to populate test data:
```bash
node seed.js
```

This creates:
- 21 users (1 admin, 20 citizens)
- 150+ realistic complaints
- Aggregated issues by ward and category

### 4. Start Backend Server
```bash
npm start          # Production mode
# OR
npm run dev        # Development mode with nodemon
```

Server runs on `http://localhost:5000`

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure API Endpoint
The frontend is already configured to connect to `http://localhost:5000/api`
(See: `frontend/src/services/api.js`)

### 3. Start Frontend Development Server
```bash
npm start
```

Frontend runs on `http://localhost:3000`

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Complaints
- `GET /api/complaints` - Get all complaints (auth required)
- `POST /api/complaints` - Create new complaint (auth required)
- `GET /api/complaints/:id` - Get specific complaint
- `PUT /api/complaints/:id/status` - Update complaint status (auth required)
- `POST /api/complaints/:id/upvote` - Upvote complaint (auth required)
- `POST /api/complaints/check-duplicate` - Check for duplicate issues

### Issues
- `GET /api/issues` - Get all issues
- `GET /api/issues/:id` - Get specific issue
- `PATCH /api/issues/:id/status` - Update issue status (auth required)
- `POST /api/issues/:id/upvote` - Upvote issue (auth required)

### Public
- `GET /api/public/issues` - Get public issues
- `GET /api/public/stats/:ward` - Get ward statistics

### Users
- `GET /api/users/me` - Get current user (auth required)

---

## Test Accounts

After running seed.js:

**Admin Account:**
- Email: `admin@civictrack.com`
- Password: `admin123`

**Citizen Accounts:**
- Email: `citizen1@example.com` to `citizen20@example.com`
- Password: `password123`

---

## MongoDB Local Setup

### Windows:
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/civictrack`

### macOS:
```bash
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu):
```bash
sudo systemctl start mongodb
```

---

## Frontend-Backend Connection

The frontend is now properly connected to the backend API:

### Key Integration Points:
1. **AuthContext** (`frontend/src/context/AuthContext.jsx`) - Uses backend API for login/register
2. **API Service** (`frontend/src/services/apiService.js`) - Centralized API calls
3. **API Module** (`frontend/src/services/api.js`) - Axios configuration with auth token

### Authentication Flow:
1. User registers/logs in via frontend
2. Backend validates credentials and returns JWT token
3. Token stored in localStorage
4. All API requests include token in `x-auth-token` header
5. Backend validates token on protected routes

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- For Atlas: Verify IP whitelist includes your machine

### CORS Error
- Backend CORS is configured for `http://localhost:3000`
- Change in `backend/server.js` if needed

### Token Issues
- Clear localStorage: `localStorage.clear()`
- Re-login in the application

### API 404 Errors
- Verify backend is running on port 5000
- Check API endpoint spelling
- Verify routes are registered in `backend/server.js`

---

## Project Structure

```
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── services/        # Business logic
│   ├── config/          # Database config
│   ├── server.js        # Main server file
│   └── seed.js          # Test data
│
└── frontend/
    ├── src/
    │   ├── context/     # React Context (Auth)
    │   ├── services/    # API calls
    │   ├── pages/       # Page components
    │   ├── components/  # Reusable components
    │   └── App.js       # Main app file
```

---

## Next Steps

1. Set up MongoDB (local or Atlas)
2. Configure .env file
3. Run `npm install` in backend
4. Run `node seed.js` to populate test data
5. Start backend with `npm start`
6. In new terminal, go to frontend
7. Run `npm install`
8. Start frontend with `npm start`
9. Open `http://localhost:3000` in browser

---

## Features

✅ User authentication (register/login)
✅ Report civic complaints
✅ Duplicate complaint detection
✅ Real-time updates via Socket.io
✅ Issue aggregation by ward
✅ Priority-based categorization
✅ Multiple dashboards (citizen, admin, ward)
✅ Community feed
✅ Impact metrics

---

## Support

For issues or questions, check:
- Error console in browser (F12)
- Backend console for server errors
- MongoDB connection logs

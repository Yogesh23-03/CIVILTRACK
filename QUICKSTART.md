# Quick Start Guide - CivIQ2

## 🚀 Get Running in 5 Minutes

### Prerequisites Check
- ✅ Node.js installed? (`node --version`)
- ✅ MongoDB running? (local or Atlas configured)
- ✅ ports 5000 (backend) and 3000 (frontend) free?

---

## 🔧 Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# (Optional) Seed test data - creates 150+ sample complaints
node seed.js

# Start server
npm start
```

**Expected Output:**
```
🚀 Server running on http://localhost:5000
✅ MongoDB connected successfully
```

---

## 🎨 Frontend Setup

In a **new terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Browser will auto-open:** `http://localhost:3000`

---

## 📝 Test Immediately

### Using Seeded Data:
```
Email: admin@civictrack.com
Password: admin123
```

### Or Register New Account:
1. Click "Register"
2. Fill in details
3. Login with created account

---

## ✨ Features to Try

1. **Report Complaint** → `/report`
2. **View Dashboard** → `/dashboard`
3. **Check Issues** → `/issues`
4. **Ward Dashboard** → `/ward-dashboard`
5. **Community Feed** → `/community`

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| **MongoDB connection error** | Ensure MongoDB is running or update MONGODB_URI in `.env` |
| **CORS error** | Backend and frontend on correct ports (5000, 3000) |
| **API 404 errors** | Check backend is running and routes are registered |
| **Login fails** | Clear browser localStorage: `localStorage.clear()` |
| **Port already in use** | Kill process or change PORT in `.env` |

---

## 📚 Useful Commands

```bash
# Backend
npm start          # Start server
npm run dev        # Start with hot reload (nodemon)

# Frontend  
npm start          # Start dev server
npm run build      # Create production build
npm test           # Run tests

# Database
node seed.js       # Populate test data
# (To reset: delete database, run seed.js again)
```

---

## 🔑 API Key (Optional)

To enable AI duplicate detection:
1. Get OpenAI API key from https://platform.openai.com/
2. Add to `.env`: `OPENAI_API_KEY=sk-...`

---

## 📖 Full Documentation

See `SETUP.md` for:
- Detailed setup instructions
- All API endpoints
- Project structure
- Troubleshooting guide

---

## 🎯 Next Steps After Setup

1. ✅ Create a complaint via `/report`
2. ✅ View it in your dashboard
3. ✅ Check aggregated issues
4. ✅ Explore different dashboards
5. ✅ Login as different users

Enjoy! 🎉

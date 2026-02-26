# Deriv Trading SaaS Platform

A sophisticated, scalable trading automation platform built with **Express.js**, **Sequelize**, and **Deriv API**.

## 🎯 **Project Overview**

This platform enables users to:
- ✅ Trade on Deriv using automated strategies
- ✅ Manage multiple accounts with role-based access
- ✅ Monitor trading activity in real-time via WebSocket
- ✅ Analyze trading performance with detailed statistics
- ✅ Secure account access with JWT-based authentication

---

## 🛠️ **Tech Stack**

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js |
| **Database** | PostgreSQL + Sequelize ORM |
| **Authentication** | JWT (JSON Web Tokens) + Bcrypt |
| **Real-time** | WebSocket |
| **Logging** | Winston |
| **External API** | Deriv API |
| **Security** | Encryption (crypto), CORS, Helmet |

---

## 📦 **Installation & Setup**

### **Prerequisites**
- Node.js v18+ and npm/yarn
- PostgreSQL 12+ running locally or remote
- Git

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/presibillionaire/deriv-trading-saas.git
cd deriv-trading-saas
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Configure Environment Variables**
```bash
cp .env.example .env
```

**Edit `.env` with your values:**
```env
# Server
NODE_ENV=development
PORT=5000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=deriv_trading_saas
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRY=7d

# Deriv API
DERIV_APP_ID=your_deriv_app_id
DERIV_API_URL=wss://ws.binaryws.com/websockets/v3

# Encryption
ENCRYPTION_KEY=your_32_char_encryption_key_here
IV_KEY=your_16_char_iv_key_here

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000
```

### **Step 4: Set Up Database**
```bash
# Create PostgreSQL database
createdb deriv_trading_saas

# Run migrations
npx sequelize-cli db:migrate

# Verify migrations
node verify-migration.js
```

### **Step 5: Start the Server**
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

✅ **Server should be running at:** `http://localhost:5000`

---

## 🔒 **Security Configuration**

See [`security-config.md`](./security-config.md) for:
- ✅ Environment variable management
- ✅ JWT best practices
- ✅ Password hashing standards
- ✅ API key rotation procedures
- ✅ CORS and HTTPS configuration
- ✅ Rate limiting & DDoS protection

---

## 📁 **Project Structure**

```
deriv-trading-saas/
├── config/              # Configuration files
├── logs/                # Application logs
├── migrations/          # Database migrations
├── models/              # Sequelize models
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Main entry point
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies
└── README.md            # This file
```

---

## 🚀 **API Endpoints** (Phase 3)

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### **Users**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### **Accounts**
- `GET /api/accounts` - List user's Deriv accounts
- `POST /api/accounts` - Link new Deriv account
- `DELETE /api/accounts/:id` - Unlink Deriv account

### **Trading**
- `GET /api/trades` - Get trading history
- `POST /api/trades` - Place a trade
- `GET /api/trades/:id` - Get trade details
- `POST /api/trades/:id/close` - Close a trade

### **Analytics**
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/reports` - Generate reports

---

## 🧪 **Testing** (Phase 3)

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

---

## 📝 **Logging**

Logs are stored in the `logs/` directory with Winston logger:
- `logs/error.log` - Error-level logs
- `logs/combined.log` - All logs

**View logs:**
```bash
tail -f logs/combined.log
```

---

## 🤝 **Contributing**

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📄 **License**

This project is proprietary. All rights reserved.

---

## 🆘 **Support**

For issues, questions, or suggestions, please open a GitHub Issue.

---

## 🔮 **Roadmap**

- ✅ Phase 1: Project Setup & Architecture
- 🔄 Phase 2: Security Hardening & Configuration (Current)
- 📋 Phase 3: API Implementation & Database Models
- 🧪 Phase 4: Testing & QA
- 🚀 Phase 5: Deployment & DevOps

---

**Last Updated:** 2026-02-26  
**Version:** 1.0.0

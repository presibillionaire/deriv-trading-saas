# 🔒 Security Configuration & Best Practices

## Phase 2: Security Hardening Checklist

---

## 1️⃣ **Environment Variable Management**

### ✅ Do's
- ✅ Store ALL sensitive data in `.env` file
- ✅ Use strong, random values (min 32 characters for keys)
- ✅ Rotate credentials every 90 days
- ✅ Use different values for dev/staging/production
- ✅ Version control `.env.example` (without secrets)

### ❌ Don'ts
- ❌ NEVER commit `.env` to Git
- ❌ NEVER hardcode secrets in code
- ❌ NEVER share `.env` files via email/Slack
- ❌ NEVER use weak passwords (e.g., "password123")

### 📋 Required Environment Variables
```env
# Server Configuration
NODE_ENV=development|staging|production
PORT=5000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=deriv_trading_saas
DB_USER=postgres
DB_PASSWORD=<strong_random_password>

# JWT Authentication
JWT_SECRET=<min_32_chars_random_string>
JWT_EXPIRY=7d

# Deriv API Credentials
DERIV_APP_ID=<your_deriv_app_id>
DERIV_API_URL=wss://ws.binaryws.com/websockets/v3

# Encryption Keys
ENCRYPTION_KEY=<32_char_random_hex>
IV_KEY=<16_char_random_hex>

# Logging
LOG_LEVEL=info|debug|error
LOG_FILE_PATH=./logs

# CORS
CORS_ORIGIN=http://localhost:3000|https://yourdomain.com
ALLOWED_ORIGINS=["http://localhost:3000","https://yourdomain.com"]

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # requests per window
```

### 🔧 **Generate Secure Keys**
```bash
# Generate JWT Secret (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key (32 chars hex = 16 bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate IV Key (16 chars hex = 8 bytes)
node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"
```

---

## 2️⃣ **Authentication & Password Security**

### JWT (JSON Web Tokens) Standards
```javascript
// DO: Use strong algorithms
const algorithm = 'HS256'; // or RS256 with public/private keys

// DO: Set reasonable expiry times
const expiryTimes = {
  access_token: '15m',      // Short-lived
  refresh_token: '7d',      // Longer-lived
  api_token: '30d'          // For API clients
};

// DO: Sign with strong secret (min 32 chars)
const secret = process.env.JWT_SECRET; // Must be 32+ chars

// DO: Verify token before processing
const verified = jwt.verify(token, secret);
```

### Password Hashing
```javascript
// DO: Use bcryptjs for password hashing
const bcrypt = require('bcryptjs');

// Hash password before storing
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Verify password on login
const isValid = await bcrypt.compare(plainPassword, hashedPassword);

// DON'T use: crypto.createHash('sha256') for passwords!
// DON'T use: Plain text or simple encoding
```

### Password Requirements (Enforce in Frontend & Backend)
- ✅ Minimum 12 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number
- ✅ At least 1 special character (!@#$%^&*)

```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

function validatePassword(password) {
  if (!passwordRegex.test(password)) {
    throw new Error('Password does not meet security requirements');
  }
}
```

---

## 3️⃣ **Database Security**

### Connection Security
```javascript
// config/config.js
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Disable SQL logging in production
    ssl: process.env.NODE_ENV === 'production' ? true : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    ssl: { require: true, rejectUnauthorized: false },
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

### Query Parameterization (Prevent SQL Injection)
```javascript
// ✅ GOOD: Use parameterized queries with Sequelize
const user = await User.findOne({
  where: { email: userInput },
  raw: true
});

// ❌ BAD: String concatenation (SQL Injection vulnerability!)
const user = await User.findOne({
  where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('email')), Sequelize.Op.eq, userInput.toLowerCase())
});
```

### Database Backup Strategy
```bash
# Backup PostgreSQL database
pg_dump -U postgres deriv_trading_saas > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres deriv_trading_saas < backup_20260226.sql

# Schedule automatic backups (cron)
0 2 * * * pg_dump -U postgres deriv_trading_saas > /backups/db_$(date +\%Y\%m\%d).sql
```

---

## 4️⃣ **API Security**

### CORS Configuration
```javascript
// src/middleware/corsMiddleware.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};

module.exports = cors(corsOptions);
```

### HTTPS & Security Headers (Helmet.js)
```javascript
// src/server.js
const helmet = require('helmet');

app.use(helmet()); // Adds security headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'wss:', 'https:']
  }
}));

app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));
```

### Rate Limiting (Prevent Brute Force & DDoS)
```javascript
// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false,  // Disable the X-RateLimit-* headers
  keyGenerator: (req) => req.ip, // Use IP address as key
  skip: (req) => req.user?.role === 'admin' // Skip rate limit for admins
});

module.exports = limiter;
```

### Input Validation (Prevent Injection Attacks)
```javascript
// DO: Validate and sanitize all user inputs
const { body, validationResult } = require('express-validator');

app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 12 }).trim().escape(),
  body('username').isAlphanumeric().trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process registration
});

// DON'T: Accept raw user input without validation
```

---

## 5️⃣ **API Key & Secret Management**

### Deriv API Credentials
```javascript
// DO: Load from environment variables
const derivAppId = process.env.DERIV_APP_ID;
const derivApiUrl = process.env.DERIV_API_URL;

// DON'T: Hardcode credentials
// const derivAppId = '12345'; // ❌ WRONG!
```

### Key Rotation Schedule
- 🔄 **JWT Secret**: Rotate every 6 months
- 🔄 **Encryption Keys**: Rotate every 3 months
- 🔄 **API Keys**: Rotate every 90 days
- 🔄 **Database Passwords**: Rotate every 90 days

### Implementation Steps
1. Generate new key
2. Add new key to environment with suffix (e.g., `JWT_SECRET_NEW`)
3. Update code to accept both old and new keys during validation
4. Deploy to production
5. Wait 24 hours for all requests to use new key
6. Remove old key from environment

---

## 6️⃣ **Encryption Best Practices**

### Data Encryption (Sensitive Fields)
```javascript
// src/utils/encryption.js
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(process.env.IV_KEY, 'hex');

function encrypt(plaintext) {
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(ciphertext) {
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

### What to Encrypt
- ✅ API tokens (Deriv tokens)
- ✅ User passwords (use bcrypt, not encryption)
- ✅ Credit card information (if storing)
- ✅ Bank account details
- ✅ Personal identification numbers

### What NOT to Encrypt
- ❌ User IDs or emails (need to be queryable)
- ❌ Timestamps or metadata
- ❌ Public information

---

## 7️⃣ **Logging & Monitoring Security**

### What to Log
```javascript
// DO: Log security-relevant events
logger.info('User login successful', { userId, email, ip });
logger.warn('Failed login attempt', { email, ip, attempts });
logger.error('Database connection error', { error, timestamp });
logger.error('Unauthorized access attempt', { userId, resource, ip });
```

### What NOT to Log
```javascript
// DON'T: Log sensitive information
logger.info('User created', { password }); // ❌ WRONG!
logger.info('API response', { creditCard }); // ❌ WRONG!
logger.info('Auth token', { token: jwtToken }); // ❌ WRONG!
```

### Log Rotation
```javascript
// src/utils/logger.js - Use winston-daily-rotate-file
const DailyRotateFile = require('winston-daily-rotate-file');

const transport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxDays: '30d',
  utc: true
});

module.exports = transport;
```

---

## 8️⃣ **Dependency Security**

### Update Dependencies Regularly
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Update all packages safely
npm update

# Check outdated packages
npm outdated
```

### Dangerous Packages to Avoid
- ❌ `eval()` - Code injection risk
- ❌ Unmaintained/deprecated packages
- ❌ Packages with known CVEs

### Monitor Dependencies
```bash
# Add to package.json scripts
"security-audit": "npm audit --audit-level=moderate"
```

---

## 9️⃣ **Deployment Security Checklist**

### Pre-Deployment
- ✅ Set `NODE_ENV=production` in all production servers
- ✅ Disable SQL logging in production
- ✅ Generate unique `JWT_SECRET` for production
- ✅ Enable HTTPS/TLS on all endpoints
- ✅ Set up firewall rules
- ✅ Configure rate limiting
- ✅ Enable CORS for production domain only
- ✅ Set up monitoring and alerting

### Infrastructure Security
- ✅ Use managed databases (RDS, CloudSQL)
- ✅ Enable database encryption at rest
- ✅ Use VPN/SSH for database access
- ✅ Implement Web Application Firewall (WAF)
- ✅ Enable DDoS protection
- ✅ Use CDN for static assets
- ✅ Regular security audits and penetration testing

### Access Control
- ✅ Implement role-based access control (RBAC)
- ✅ Use principle of least privilege
- ✅ Audit all admin access
- ✅ Implement multi-factor authentication (MFA) for admins

---

## 🔟 **Incident Response Plan**

### If Credentials Are Compromised
1. **Immediately revoke** the compromised credential
2. **Generate new** credential with unique value
3. **Update environment** on all servers
4. **Restart all services** to load new credentials
5. **Audit logs** for unauthorized access
6. **Notify users** if personal data was exposed
7. **Post-mortem** to prevent future incidents

---

## 📚 **Security Resources**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT.io](https://jwt.io/) - JWT specifications
- [Sequelize Security](https://sequelize.org/docs/v6/other-topics/security/)

---

## 🎯 **Phase 2 Completion Tasks**

- [ ] Create/update `.gitignore` file
- [ ] Create comprehensive `README.md`
- [ ] Create `security-config.md` (this file)
- [ ] Update `.env.example` with all required variables
- [ ] Review and standardize `config/config.js`
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Test `.gitignore` (verify sensitive files aren't committed)
- [ ] Document security procedures for your team
- [ ] Set up monitoring and alerting infrastructure

---

**Last Updated:** 2026-02-26  
**Status:** Phase 2 Active

# 📚 **Deriv Trading SaaS - API Documentation**

## **Base URL**
```
http://localhost:5000/api
```

## **Authentication**
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer {accessToken}
```

---

## **🔐 Authentication Endpoints**

### **1. Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username123",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username123",
    "role": "user",
    "status": "active"
  },
  "message": "User registered successfully. Please verify your email."
}
```

---

### **2. Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username123"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 7
}
```

---

### **3. Refresh Token**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "15m"
}
```

---

### **4. Verify Email**
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### **5. Forgot Password**
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account exists, password reset link will be sent"
}
```

---

### **6. Reset Password**
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### **7. Change Password** *(Protected)*
```http
POST /api/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## **Error Responses**

### **400 Bad Request**
```json
{
  "success": false,
  "error": "Email, username, and password are required"
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

---

## **Password Requirements**
- Minimum 12 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (@$!%*?&)

**Example:** `SecurePass123!`

---

## **HTTP Status Codes**
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## **Rate Limiting**
- **Window:** 15 minutes
- **Max Requests:** 100 per IP

Response header: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## **Next Endpoints (Coming Soon)**
- `POST /api/accounts` - Link Deriv account
- `GET /api/accounts` - List user accounts
- `POST /api/trades` - Place trade
- `GET /api/trades` - Get trading history
- `GET /api/analytics/dashboard` - Performance analytics

---

**Last Updated:** 2026-02-26  
**Version:** 1.0.0

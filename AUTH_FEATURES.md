# Binance Work - Authentication & User System

## Overview
The app now features a complete professional authentication system with signup, login, and password recovery functionality.

---

## Authentication Features

### 1. **Landing Page**
- Hero section with "Earn daily profit with Binance Work" tagline
- Feature highlights with checkmarks
- Call-to-action buttons for signup and login
- Professional gradient background design

### 2. **Signup Flow**
- **Email input**: Company email address associated with Binance
- **Phone number**: User's contact number
- **No Binance PIN required** (removed for simplicity)
- OTP verification via email
- Seamless transition to dashboard after verification

### 3. **Login Flow**
- Email-only login (no password required)
- OTP-based authentication
- "Forgot Password" link for password recovery
- One-click access for existing users

### 4. **Forgot Password**
- Email-based password reset
- Reset token sent via email
- Secure token expiration (1 hour)
- Privacy-safe error messages (doesn't reveal if email exists)
- Automatic redirect to login after successful reset

---

## API Endpoints

### Authentication Endpoints

#### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@company.com",
  "phone": "+1234567890"
}

Response:
{
  "success": true,
  "message": "OTP sent to your email",
  "userId": 123
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@company.com"
}

Response:
{
  "success": true,
  "message": "OTP sent to your email",
  "userId": 123
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "userId": 123,
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Email verified successfully",
  "session": "session_token_here"
}
```

#### Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@company.com"
}

Response:
{
  "success": true,
  "message": "If an account exists, reset instructions have been sent"
}
```

---

## User Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  balance DECIMAL(18, 8) DEFAULT 0,
  deposit_address VARCHAR(255),
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expires_at TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Email Templates

### OTP Verification Email
- Professional HTML template
- Shows 6-digit OTP code prominently
- Displays expiration time (10 minutes)
- Includes security notice
- Branded with Binance Work logo

### Password Reset Email
- Similar professional design
- Shows reset token/code
- Displays longer expiration (1 hour)
- Includes support contact option

---

## Security Features

✅ **OTP-based Authentication**
- 6-digit random codes
- 10-minute expiration for login OTP
- 1-hour expiration for password reset tokens
- Secure database storage

✅ **Email Verification**
- Verified user accounts
- Email uniqueness enforcement
- Resend integration for reliability

✅ **Session Management**
- HTTP-only secure cookies
- Session token validation
- Automatic session expiration

✅ **Password Safety**
- No plain text passwords stored
- Bcrypt hashing for sensitive data
- Reset token encryption

✅ **Privacy Protection**
- Doesn't reveal if email exists
- Secure error messages
- No user enumeration attacks

---

## User Flows

### New User Signup
1. User lands on landing page
2. Clicks "Create Account"
3. Enters email and phone
4. System sends OTP to email
5. User enters OTP
6. Account created, redirected to dashboard

### Existing User Login
1. User clicks "Sign In"
2. Enters email address
3. System sends OTP
4. User verifies OTP
5. Redirected to dashboard

### Password Recovery
1. User clicks "Forgot Password"
2. Enters email address
3. System sends password reset code
4. User enters reset code
5. User sets new password
6. Redirected to login

---

## Dashboard After Authentication

Once logged in, users see:
- **Balance Display**: Current USDT balance
- **Deposit Panel**: QR code and BEP20 address for deposits
- **Minimum Requirement**: 500 USDT to activate
- **Run Button**: Only available with 500+ USDT balance
- **Recent Deposits**: Transaction history

---

## Environment Variables Required

```
RESEND_API_KEY=your_resend_api_key
DATABASE_URL=postgresql://user:password@host/database
HD_WALLET_ADDRESS=0x...
HOT_WALLET_ADDRESS=0x...
HD_WALLET_MNEMONIC=word1 word2 word3...
```

---

## Testing the System

### Test Signup
1. Enter test email: test@company.com
2. Enter phone: +1234567890
3. Check email for OTP
4. Enter OTP code
5. Should see dashboard

### Test Login
1. Use existing email
2. System sends new OTP
3. Enter OTP from email
4. Access dashboard

### Test Password Recovery
1. Click "Forgot Password"
2. Enter email
3. Check email for reset code
4. Enter code to reset
5. Return to login

---

## Design & UX

- **Professional gradient background**: Dark gray to amber
- **Clean white forms**: High contrast for readability
- **Amber accent color** (#f59e0b): Brand consistency
- **Mobile responsive**: Works on all screen sizes
- **Smooth transitions**: Between auth screens
- **Clear feedback**: Error and success messages
- **Accessible buttons**: Large touch targets
- **Readable typography**: Clear hierarchy

---

## Next Steps / Future Enhancements

- [ ] Social login (Google, Apple, etc.)
- [ ] Two-factor authentication (2FA)
- [ ] Biometric authentication
- [ ] Account settings page
- [ ] Email notification preferences
- [ ] Login history/device management
- [ ] Account deletion option

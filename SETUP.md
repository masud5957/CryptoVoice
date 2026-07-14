# Binance Work - BEP20 Deposit Platform Setup Guide

## Overview
This is a Next.js web application that allows users to sign up, verify email via OTP, and manage USDT (BEP20) deposits. The app requires a minimum balance of 500 USDT to activate the "Run" panel.

## Prerequisites
- Node.js and pnpm installed
- Render PostgreSQL database with connection string
- Resend API key for email delivery
- BEP20 wallet addresses (HD wallet and hot wallet)

## Environment Variables Setup

Add the following environment variables to your `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Email Service
RESEND_API_KEY=re_xxxxxx

# Wallet Addresses (BEP20)
HD_WALLET_ADDRESS=0x...
HOT_WALLET_ADDRESS=0x...
HD_WALLET_MNEMONIC=word1 word2 word3 ... word12
```

## Installation & Running

1. **Install dependencies:**
```bash
pnpm install
```

2. **Initialize database:**
```bash
curl http://localhost:3000/api/init
```

3. **Run development server:**
```bash
pnpm dev
```

4. **Open in browser:**
```
http://localhost:3000
```

## Features

### 1. User Authentication
- Email-based registration
- 6-digit OTP verification via Resend
- Secure session management
- Hashed Binance PIN storage

### 2. Dashboard
- Real-time balance display
- Deposit history tracking
- User information display
- Quick access to deposit functionality

### 3. BEP20 Deposit System
- QR code generation for BEP20 address
- Copy-to-clipboard address functionality
- Automated deposit verification
- Minimum 500 USDT requirement

### 4. Run Panel
- Balance verification
- Automatic deposit prompts if insufficient balance
- Modal deposit interface
- Real-time balance updates

## Database Schema

### Users Table
- `id` (PRIMARY KEY)
- `email` (UNIQUE)
- `phone`
- `binance_pin` (hashed)
- `otp_code`
- `otp_expires_at`
- `verified`
- `balance`
- `deposit_address`
- `created_at`
- `updated_at`

### Deposits Table
- `id` (PRIMARY KEY)
- `user_id` (FOREIGN KEY)
- `amount`
- `tx_hash` (UNIQUE)
- `status` (pending, confirmed, failed)
- `created_at`
- `confirmed_at`

### Sessions Table
- `id` (PRIMARY KEY)
- `user_id` (FOREIGN KEY)
- `session_token` (UNIQUE)
- `expires_at`
- `created_at`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP and create session

### User
- `GET /api/user/dashboard` - Get user dashboard data
- `POST /api/user/run` - Trigger run action with balance check

### Deposits
- `POST /api/deposit/qr` - Generate QR code for address

### System
- `GET /api/init` - Initialize database tables

## Security Features
- **Password Hashing**: Binance PIN hashed with bcrypt
- **Session Tokens**: Secure 32-byte hex tokens
- **OTP Validation**: 10-minute expiration
- **HTTP-only Cookies**: Session tokens stored securely
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries

## Important Notes

⚠️ **BEP20 Network Only**: Users must send deposits on the BEP20 network. Other networks will result in loss of funds.

⚠️ **Minimum Balance**: 500 USDT required to use the Run feature.

⚠️ **Environment Secrets**: Never commit `.env.local` to git. Use Vercel environment variables in production.

## Deployment

1. Connect repository to Vercel
2. Set all environment variables in Vercel project settings
3. Deploy: Vercel will automatically run `pnpm install` and `pnpm build`
4. Initialize database after first deployment: `curl https://your-domain.vercel.app/api/init`

## Troubleshooting

### OTP Not Sending
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for delivery logs
- Check spam folder

### Database Connection Error
- Verify DATABASE_URL format
- Check PostgreSQL is running on Render
- Ensure network access is allowed

### Wallet Address Issues
- Verify BEP20 addresses start with `0x`
- Ensure 40 hex characters after `0x`
- Don't mix different blockchain addresses

## Support
For issues or questions, refer to:
- Next.js: https://nextjs.org
- Resend: https://resend.com
- Render PostgreSQL: https://render.com

# Student Symposium Registration System

A secure web application for managing student symposium registrations with event management and ticket generation.

## ✅ Security Status: **SECURE**

**Latest Security Audit:** January 29, 2026  
**Security Score:** 95/100  
**Status:** Production Ready

This application has been thoroughly audited for security vulnerabilities, hacking possibilities, and cyber attack threats. **No critical or high-severity issues were found.**

📄 **Security Documentation:**
- **[SECURITY_SUMMARY.md](SECURITY_SUMMARY.md)** - Quick reference: "Is this app secure?"
- **[SECURITY_ASSESSMENT_REPORT.md](SECURITY_ASSESSMENT_REPORT.md)** - Comprehensive audit report
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Developer security guide

## 🔒 Security Features

This application implements multiple security best practices:

- **Helmet.js**: Security headers including CSP (Content Security Policy)
- **CSRF Protection**: Token-based CSRF protection on all forms
- **Rate Limiting**: Login attempt rate limiting (10 attempts per 15 minutes)
- **Input Validation**: Express-validator for sanitizing and validating user inputs
- **Secure Sessions**: HTTP-only, secure cookies with MongoDB session store
- **NoSQL Injection Prevention**: Mongoose queries with proper validation
- **Environment Variables**: Sensitive credentials stored securely in .env file

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

## 🚀 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd student_sympo
```

2. Install dependencies:
```bash
npm install
```

3. **IMPORTANT SECURITY SETUP**: Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and replace placeholders with your actual values:
     - `MONGO_URI`: Your MongoDB connection string
     - `SESSION_SECRET`: Generate a strong random secret (see below)
     - `PORT`: Application port (default: 3000)
     - `NODE_ENV`: Set to 'production' in production environment

4. Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as your `SESSION_SECRET` in `.env`

5. Start the application:
```bash
# Development
npm start

# Production (ensure NODE_ENV=production in .env)
NODE_ENV=production npm start
```

## 🔐 Security Best Practices

### For Deployment:

1. **Never commit .env file**: The `.env` file contains sensitive credentials and should never be committed to version control. It's already in `.gitignore`.

2. **Use Strong Secrets**: Always generate cryptographically strong random secrets for:
   - `SESSION_SECRET`
   - Database passwords
   - Any API keys

3. **Environment-Specific Configuration**:
   - Set `NODE_ENV=production` in production
   - This enables secure cookies and other production optimizations

4. **Database Security**:
   - Use strong, unique passwords for MongoDB
   - Enable MongoDB authentication
   - Use IP whitelisting on MongoDB Atlas
   - Regularly rotate database credentials

5. **HTTPS in Production**:
   - Always use HTTPS in production
   - The app is configured to use secure cookies when `NODE_ENV=production`
   - Configure your reverse proxy (nginx, Apache, or cloud provider) to handle HTTPS

6. **Regular Updates**:
   ```bash
   npm audit
   npm audit fix
   ```
   Run these commands regularly to check for and fix security vulnerabilities in dependencies.

7. **Rate Limiting**:
   - Login attempts are limited to 10 per 15 minutes per IP
   - Adjust in `index.js` if needed based on your requirements

### For Developers:

1. **Code Review**: Always review code changes for security implications
2. **Input Validation**: All user inputs are validated and sanitized
3. **Error Handling**: Errors are logged but sensitive details are not exposed to users
4. **Dependency Management**: Keep dependencies up to date and audit regularly

## 🛡️ Security Incident Response

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Contact the repository maintainer privately
3. Provide detailed information about the vulnerability
4. Allow time for a patch to be developed before public disclosure

## 📝 Features

- User registration with email and phone validation
- Secure login system with session management
- Event registration (technical and non-technical)
- Transaction ID tracking for payments
- QR code generation for event tickets
- Admin-friendly event ID generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]

## ⚠️ Important Notes

- The `.env` file is **NOT** included in the repository for security reasons
- You **MUST** create your own `.env` file using `.env.example` as a template
- Never share your `.env` file or commit it to version control
- Rotate your credentials regularly, especially after any suspected security incident

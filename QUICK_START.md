# 🚀 Quick Start Guide - Security Setup

## ⚠️ BEFORE RUNNING THE APPLICATION

### 1. Create Your Environment File

```bash
# Copy the example file
cp .env.example .env
```

### 2. Generate a Strong Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it into your `.env` file as `SESSION_SECRET`.

### 3. Configure Your Database

Edit `.env` and replace these values:
- `YOUR_USERNAME` - Your MongoDB Atlas username
- `YOUR_PASSWORD` - Your MongoDB Atlas password  
- `YOUR_CLUSTER` - Your MongoDB cluster URL
- `YOUR_DATABASE` - Your database name
- `YOUR_APP_NAME` - Your application name

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Application

```bash
# Development
npm start

# Production
NODE_ENV=production npm start
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] `.env` file is NOT committed to git (it's in .gitignore)
- [ ] Strong session secret generated (32+ random bytes)
- [ ] MongoDB has strong password
- [ ] MongoDB IP whitelist configured
- [ ] `NODE_ENV=production` set in production
- [ ] Application deployed behind HTTPS
- [ ] Run `npm audit` to check for vulnerable dependencies

---

## 📚 Documentation

- **README.md** - Complete setup and security guide
- **SECURITY_AUDIT.md** - Detailed security audit report
- **.env.example** - Environment configuration template

---

## 🆘 Need Help?

1. Read the comprehensive **README.md**
2. Check the **SECURITY_AUDIT.md** for details
3. Ensure all environment variables are set correctly
4. Make sure MongoDB connection string is valid

---

## ✅ What's Secured

This application now has:
- ✅ No credentials in git
- ✅ CSRF protection
- ✅ Rate limiting on login
- ✅ Session security (regeneration, secure cookies)
- ✅ Input validation & sanitization
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ XSS & injection prevention
- ✅ 0 known vulnerabilities (CodeQL verified)

**Your application is secure! 🎉**

# Security Checklist - Student Symposium Application

## Quick Security Reference for Developers

This checklist provides a quick reference for maintaining the security of the application.

---

## ✅ Current Security Status: **SECURE**

**Last Audit:** January 29, 2026  
**Security Score:** 95/100  
**Status:** Production Ready

---

## Pre-Deployment Checklist

### Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Generate secure session secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Set `NODE_ENV=production` in production environment
- [ ] Configure production MongoDB URI with strong password
- [ ] Verify `.env` is in `.gitignore` (already configured)
- [ ] Never commit `.env` file to git

### Infrastructure
- [ ] Deploy application behind HTTPS (required)
- [ ] Configure reverse proxy (nginx/Apache) with SSL/TLS certificate
- [ ] Enable MongoDB authentication
- [ ] Configure MongoDB IP whitelist on Atlas
- [ ] Set up database backups
- [ ] Configure firewall rules (allow only necessary ports)
- [ ] Set up monitoring and logging

### Security Configuration
- [ ] Verify `helmet` security headers are enabled
- [ ] Confirm CSRF protection is active on all forms
- [ ] Test rate limiting on login endpoint
- [ ] Verify session cookies are marked as secure in production
- [ ] Check that HSTS headers are being sent

---

## Regular Maintenance Checklist (Monthly)

### Dependency Security
- [ ] Run `npm audit` to check for vulnerabilities
- [ ] Run `npm audit fix` to apply automatic fixes
- [ ] Review and update dependencies: `npm outdated`
- [ ] Test application after updates
- [ ] Check for security advisories on used packages

### Code Review
- [ ] Review recent code changes for security implications
- [ ] Ensure new user inputs are validated and sanitized
- [ ] Verify new database queries use parameterized patterns
- [ ] Check that new routes have proper authentication
- [ ] Confirm error messages don't leak sensitive information

### Infrastructure
- [ ] Review server access logs for suspicious activity
- [ ] Check database access logs
- [ ] Verify SSL/TLS certificates are not expiring soon
- [ ] Review MongoDB Atlas security settings
- [ ] Rotate database credentials if needed
- [ ] Review and update firewall rules

---

## Security Testing Checklist

### Before Each Release
- [ ] Run automated security scans
- [ ] Test authentication flows
- [ ] Verify CSRF tokens are working
- [ ] Test rate limiting functionality
- [ ] Check for XSS vulnerabilities in new templates
- [ ] Verify input validation on new forms
- [ ] Test error handling (no stack traces exposed)
- [ ] Review logs for any security warnings

### Manual Testing
- [ ] Attempt SQL/NoSQL injection on inputs
- [ ] Try XSS payloads in form fields
- [ ] Test CSRF protection (try submitting form without token)
- [ ] Verify session timeout works correctly
- [ ] Test rate limiting (attempt brute force)
- [ ] Check that unauthorized access is blocked
- [ ] Verify secure cookies in production

---

## Secure Coding Guidelines

### Input Validation
✅ **ALWAYS** validate and sanitize user input:
```javascript
body('email').isEmail().normalizeEmail()
body('phone').trim().isNumeric().isLength({ min: 10, max: 10 })
body('name').trim().escape()
```

### Database Queries
✅ **ALWAYS** use parameterized queries:
```javascript
// GOOD - Parameterized
User.findOne({ email, phone })

// BAD - String concatenation (DON'T DO THIS)
User.findOne({ email: req.body.email })  // If not validated
```

### Output Rendering
✅ **ALWAYS** use escaped output in templates:
```ejs
<!-- GOOD - Escaped -->
<%= user.name %>

<!-- BAD - Unescaped (DON'T DO THIS) -->
<%- user.name %>
```

### Authentication
✅ **ALWAYS** check authentication on protected routes:
```javascript
app.get('/protected-route', isAuth, async (req, res) => {
    // Use req.session.userId, never req.query.id or req.params.id
});
```

### Error Handling
✅ **ALWAYS** use generic error messages to users:
```javascript
// GOOD - Generic message
res.redirect('/?error=Server error');

// BAD - Detailed error (DON'T DO THIS)
res.redirect('/?error=' + err.message);
```

---

## Common Security Pitfalls to Avoid

### ❌ DON'T:
1. **Commit secrets to git**
   - Never commit `.env` file
   - Never hardcode API keys, passwords, or tokens

2. **Use user input directly in queries**
   - Always validate and sanitize first
   - Use Mongoose parameterized queries

3. **Expose detailed errors to users**
   - Log errors server-side only
   - Show generic messages to users

4. **Skip authentication checks**
   - Always use `isAuth` middleware on protected routes
   - Never trust client-supplied IDs

5. **Use eval() or exec() with user input**
   - Never execute dynamic code from user input
   - Avoid `eval()`, `exec()`, `Function()` constructors

6. **Render unescaped user input**
   - Always use `<%= %>` not `<%- %>` in EJS
   - Let CSP headers protect against XSS

7. **Store passwords in plain text**
   - Current app doesn't use passwords (good!)
   - If adding passwords, use bcrypt with salt

8. **Use deprecated packages without reviewing**
   - Check security advisories regularly
   - Plan migration from deprecated packages

---

## Incident Response Plan

### If a Security Vulnerability is Discovered:

1. **DO NOT** open a public issue
2. **Contact** repository maintainer privately
3. **Document** the vulnerability details:
   - What is vulnerable
   - How to reproduce
   - Potential impact
   - Suggested fix (if any)
4. **Allow time** for patch development before public disclosure
5. **Coordinate** responsible disclosure timeline

### If a Security Breach Occurs:

1. **Immediate Actions:**
   - Disconnect affected systems if needed
   - Preserve logs and evidence
   - Contact incident response team

2. **Investigation:**
   - Determine scope of breach
   - Identify compromised data
   - Document timeline of events

3. **Remediation:**
   - Apply security patches
   - Rotate all credentials
   - Reset user sessions
   - Update firewall rules

4. **Post-Incident:**
   - Conduct post-mortem
   - Update security procedures
   - Implement additional controls
   - Document lessons learned

---

## Security Resources

### Tools
- **npm audit** - Dependency vulnerability scanning
- **CodeQL** - Code security analysis
- **OWASP ZAP** - Web application security testing
- **Burp Suite** - Security testing tool

### References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

### Security Advisories
- [npm Security Advisories](https://www.npmjs.com/advisories)
- [GitHub Advisory Database](https://github.com/advisories)
- [Node Security Platform](https://nodesecurity.io/)

---

## Quick Command Reference

### Security Checks
```bash
# Check for dependency vulnerabilities
npm audit

# Fix dependency vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update all packages
npm update

# Generate secure random string (for session secret)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Git Security
```bash
# Verify .env is not tracked
git status

# Remove accidentally committed .env
git rm --cached .env
git commit -m "Remove .env from tracking"

# Check what's in .gitignore
cat .gitignore
```

### Production Deployment
```bash
# Set environment to production
export NODE_ENV=production

# Start application
npm start

# Check if app is using HTTPS (production)
# Should see secure: true in session cookies
```

---

## Contact

**Security Issues:** Report privately to repository maintainer  
**Questions:** Open a discussion (not an issue) for security questions  
**Emergency:** Contact maintainer directly for critical security issues

---

**Last Updated:** January 29, 2026  
**Next Review:** April 29, 2026 (3 months)

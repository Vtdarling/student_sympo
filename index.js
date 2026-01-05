require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

const app = express();

/* ---------------- PROXY TRUST ---------------- */
app.set('trust proxy', 1);

/* ---------------- DATABASE ---------------- */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ Mongo Error:', err));

/* ---------------- SECURITY MIDDLEWARE ---------------- */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "https://api.qrserver.com"],
            upgradeInsecureRequests: [],
        },
    },
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

/* ---------------- SESSION ---------------- */
app.use(session({
    name: 'symposium.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 30 // 30 Minutes
    }
}));

/* ---------------- CSRF PROTECTION ---------------- */
const csrfProtection = csrf();

/* ---------------- RATE LIMITING ---------------- */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts. Please try again after 15 minutes."
});

/* ---------------- DB SCHEMA ---------------- */
const userSchema = new mongoose.Schema({
    event_id: { type: String, unique: true },
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    
    college: { type: String, default: 'Not Provided' },
    technical_event: { type: String, default: 'Pending' },
    non_technical_event: { type: String, default: 'Pending' },
    transaction_id: { type: String }, 
    registeredAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

/* ---------------- HELPERS ---------------- */
function isAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/?error=Please login');
    }
    next();
}

/* ---------------- ROUTES ---------------- */

// LOGIN PAGE
app.get('/', csrfProtection, (req, res) => {
    res.render('login', {
        error: req.query.error || null,
        csrfToken: req.csrfToken()
    });
});

// LOGIN LOGIC
app.post(
    '/login',
    loginLimiter,
    csrfProtection,
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().isNumeric().isLength({ min: 10, max: 10 }),
    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            return res.redirect('/?error=Invalid credentials format');
        }

        const { email, phone } = req.body;

        try {
            const user = await User.findOne({ email, phone });
            
            if (!user) {
                return res.redirect('/?error=Account not found. Please Register first.');
            }

            req.session.userId = user._id;
            res.redirect('/home');
        } catch (err) {
            console.error(err);
            res.redirect('/?error=Server error');
        }
    }
);

// SIGNUP PAGE
app.get('/signup', csrfProtection, (req, res) => {
    res.render('signup', {
        error: null,
        csrfToken: req.csrfToken()
    });
});

// SIGNUP LOGIC
app.post('/signup', 
    csrfProtection,
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().isNumeric().isLength({ min: 10, max: 10 }),
    body('name').trim().escape(),
    async (req, res) => {
        try {
            if (!validationResult(req).isEmpty()) {
                return res.render('signup', { error: "Invalid inputs", csrfToken: req.csrfToken() });
            }

            const exists = await User.findOne({
                $or: [{ email: req.body.email }, { phone: req.body.phone }]
            });

            if (exists) {
                return res.render('signup', { 
                    error: "Email or Phone already registered. Please Login.", 
                    csrfToken: req.csrfToken() 
                });
            }

            const tempEventId = 'TEMP_' + crypto.randomBytes(4).toString('hex').toUpperCase();
            const tempTxnId = 'PENDING_' + crypto.randomBytes(4).toString('hex').toUpperCase();

            const user = new User({
                event_id: tempEventId, 
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                transaction_id: tempTxnId
            });

            await user.save();

            res.redirect('/?error=Account created! Please login to complete registration.');

        } catch (err) {
            console.error("Signup Error:", err); 
            res.render('signup', { error: "System Error. Please try again.", csrfToken: req.csrfToken() });
        }
    }
);

// HOME PAGE
app.get('/home', isAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/');
        }

        const isFullyRegistered = user.event_id && !user.event_id.startsWith('TEMP_');

        res.render('home', {
            registered: isFullyRegistered,
            event_id: user.event_id,
            user: user
        });
    } catch (err) {
        console.error(err);
        req.session.destroy();
        res.redirect('/');
    }
});

// REGISTER PAGE (Pre-fill)
app.get('/register', csrfProtection, async (req, res) => {
    let user = null;
    if (req.session.userId) {
        user = await User.findById(req.session.userId);
    }
    res.render('register', {
        error: null,
        csrfToken: req.csrfToken(),
        user: user
    });
});

// 🛡️ UPDATED REGISTER LOGIC: DUPLICATE CHECK ADDED
app.post('/register', 
    csrfProtection,
    body('college').trim().escape(),
    body('transaction_id').trim().escape(),
    async (req, res) => {
        try {
            if (!req.session.userId) return res.redirect('/signup');

            const currentUser = await User.findById(req.session.userId);
            if (!currentUser) return res.redirect('/logout');

            // 1. DUPLICATE CHECK
            // Check if Transaction ID matches any OTHER user (exclude current user)
            const conflict = await User.findOne({
                _id: { $ne: currentUser._id }, // Not equal to current user
                transaction_id: req.body.transaction_id
            });

            if (conflict) {
                // Return to register page with error
                return res.render('register', {
                    error: "⚠️ Transaction ID is already used by another participant.",
                    csrfToken: req.csrfToken(),
                    user: currentUser // Keep form pre-filled
                });
            }

            // 2. GENERATE ID (If needed)
            if (currentUser.event_id.startsWith('TEMP_')) {
                const lastUser = await User.findOne({ 
                    event_id: { $regex: /^sympo121/ } 
                }).sort({ event_id: -1 });
                
                let nextSequence = 1;
                if (lastUser) {
                    const currentIdStr = lastUser.event_id.replace('sympo121', '');
                    const currentIdNum = parseInt(currentIdStr, 10);
                    if (!isNaN(currentIdNum)) nextSequence = currentIdNum + 1;
                }

                const paddedSequence = nextSequence.toString().padStart(2, '0');
                currentUser.event_id = `sympo121${paddedSequence}`;
            }

            // 3. Update User
            currentUser.college = req.body.college;
            currentUser.technical_event = req.body.technical_event;
            currentUser.non_technical_event = req.body.non_technical_event;
            currentUser.transaction_id = req.body.transaction_id;

            await currentUser.save();
            
            return res.render('success', { name: currentUser.name, event_id: currentUser.event_id });

        } catch (err) {
            console.error(err);
            // Fallback for unexpected errors
            const user = await User.findById(req.session.userId);
            res.render('register', {
                error: "System error. Please verify input and try again.",
                csrfToken: req.csrfToken(),
                user: user
            });
        }
    }
);

// CONFIRMATION TICKET
app.get('/confirmation', isAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/');
        res.render('confirmation', { user });
    } catch (err) {
        res.redirect('/home');
    }
});

// LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
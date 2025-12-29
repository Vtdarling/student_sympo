const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// --- DATABASE CONNECTION ---
const dbURI = "mongodb+srv://720723110803_db_user:darling%40123@cluster0.ddwhmyt.mongodb.net/symposiumDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(dbURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
    });

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
    event_id: String,
    name: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    college: String,
    technical_event: String,
    non_technical_event: String,
    transaction_id: { type: String, unique: true },
    registeredAt: { type: Date, default: Date.now }
});

const loginSchema = new mongoose.Schema({
    email: { type: String, required: true },
    phone: { type: String, required: true },
    loginTime: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const LoginEntry = mongoose.model('LoginEntry', loginSchema);

// --- MIDDLEWARE ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// --- HELPER ---
async function generateNextId() {
    const count = await User.countDocuments(); 
    const nextIdNumber = count + 1;
    return nextIdNumber.toString().padStart(2, '0');
}

// --- ROUTES ---

// 1. ROOT: Login
app.get('/', (req, res) => {
    // Capture error from query params (e.g., ?error=Please login)
    const errorMsg = req.query.error || null;
    res.render('login', { error: errorMsg });
});

// 2. LOGOUT
app.get('/logout', (req, res) => {
    res.redirect('/');
});

// 3. LOGIN POST
app.post('/login', async (req, res) => {
    try {
        const { email, phone } = req.body;
        const newLogin = new LoginEntry({ email, phone });
        await newLogin.save();
        
        let user = await User.findOne({ email: email, phone: phone });

        if (user) {
            // Self-Healing: Generate ID if missing
            if (!user.event_id) {
                user.event_id = await generateNextId();
                await user.save();
            }
            // SUCCESS: Redirect with ID
            return res.redirect(`/home?registered=true&event_id=${user.event_id}`);
        }

        const partial = await User.findOne({ $or: [{ email }, { phone }] });
        if (partial) {
            return res.render('login', { error: "Invalid Email and Phone combination." });
        }

        res.redirect(`/home?registered=false`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing login.");
    }
});

// 4. HOME DASHBOARD
app.get('/home', (req, res) => {
    const isRegistered = req.query.registered === 'true';
    const eventId = req.query.event_id || '';
    
    res.render('home', { registered: isRegistered, event_id: eventId });
});

// 5. REGISTER GET
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// 6. REGISTER POST
app.post('/register', async (req, res) => {
    try {
        const { name, email, phone, college, technical_event, non_technical_event, transaction_id } = req.body;

        if (await User.findOne({ email })) return res.render('register', { error: `Email '${email}' already registered.` });
        if (await User.findOne({ phone })) return res.render('register', { error: `Phone '${phone}' already registered.` });
        if (await User.findOne({ transaction_id })) return res.render('register', { error: `Transaction ID '${transaction_id}' already used!` });

        const eventId = await generateNextId();

        const user = new User({
            event_id: eventId,
            name, email, phone, college,
            technical_event, non_technical_event, transaction_id
        });

        await user.save();
        res.render('success', { name: user.name, event_id: user.event_id });

    } catch (err) {
        console.error("Registration Error:", err);
        res.render('register', { error: "System error. Please try again later." });
    }
});

// 7. CONFIRMATION GET (FIXED)
app.get('/confirmation', async (req, res) => {
    try {
        const eventId = req.query.event_id; 

        // FIX: Redirect to login instead of showing raw text error
        if (!eventId) {
            return res.redirect('/?error=Session expired. Please login to view ticket.');
        }

        const user = await User.findOne({ event_id: eventId });
        
        if (user) {
            res.render('confirmation', { user: user });
        } else {
            return res.redirect('/?error=Ticket not found. Please login again.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
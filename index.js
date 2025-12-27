const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// 1. Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/student_sympo')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. Define Schemas & Models

// Schema for Registration Data
const userSchema = new mongoose.Schema({
    event_id: String, // New Field for generated ID
    name: String,
    email: String,
    phone: String,
    college: String,
    technical_event: String,
    non_technical_event: String,
    transaction_id: String,
    registeredAt: { type: Date, default: Date.now } // Track registration time
});

// Schema for Login Logs
const loginSchema = new mongoose.Schema({
    email: { type: String, required: true },
    phone: { type: String, required: true },
    loginTime: { type: Date, default: Date.now }
});

// 3. Create Models
const User = mongoose.model('User', userSchema);
const LoginEntry = mongoose.model('LoginEntry', loginSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); 
app.set('view engine', 'ejs');

// --- ROUTES ---

// ROOT: Login Page
app.get('/', (req, res) => {
    res.render('login');
});

// LOGOUT
app.get('/logout', (req, res) => {
    res.redirect('/');
});

// LOGIN POST
app.post('/login', async (req, res) => {
    try {
        const newLogin = new LoginEntry({
            email: req.body.email,
            phone: req.body.phone
        });
        await newLogin.save();
        
        // Check if user is already registered
        const existingUser = await User.findOne({ 
            $or: [{ email: req.body.email }, { phone: req.body.phone }] 
        });

        const isRegistered = !!existingUser;
        res.redirect(`/home?registered=${isRegistered}`); 

    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing login.");
    }
});

// HOME
app.get('/home', (req, res) => {
    const isRegistered = req.query.registered === 'true';
    res.render('home', { registered: isRegistered });
});

// REGISTER GET
app.get('/register', (req, res) => {
    res.render('register');
});

// REGISTER POST
app.post('/register', async (req, res) => {
    try {
        console.log("Received registration request for:", req.body.name);

        const filter = { 
            $or: [{ email: req.body.email }, { phone: req.body.phone }] 
        };

        // Check if user exists first to avoid generating new ID for updates
        let user = await User.findOne(filter);

        if (!user) {
            // GENERATE NEW EVENT ID (First Come First Serve)
            const count = await User.countDocuments(); // Count existing users
            const nextIdNumber = count + 1;
            // Pad with leading zero if less than 10 (e.g., 01, 02, ... 10, 11)
            const eventId = `Sympo${nextIdNumber.toString().padStart(2, '0')}`;
            
            console.log(`Generating new Event ID: ${eventId}`);

            // Create new user object
            user = new User({
                event_id: eventId,
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                college: req.body.college,
                technical_event: req.body.technical_event,
                non_technical_event: req.body.non_technical_event,
                transaction_id: req.body.transaction_id
            });

            await user.save();
            console.log(`New User Registered: ${user.name} (${user.event_id})`);
        } else {
            // If user exists, update details but KEEP original event_id
            user.name = req.body.name;
            user.college = req.body.college;
            user.technical_event = req.body.technical_event;
            user.non_technical_event = req.body.non_technical_event;
            user.transaction_id = req.body.transaction_id;
            
            await user.save();
            console.log(`User Updated: ${user.name} (${user.event_id})`);
        }

        // Always Render Success Page
        res.render('success', { name: user.name }); 

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).send("Error registering user: " + err.message);
    }
});

// CONFIRMATION GET
app.get('/confirmation', async (req, res) => {
    try {
        // Ideally use session/ID, but creating simplistic logic as requested:
        // Get the most recently registered/updated user
        const latestUser = await User.findOne().sort({ registeredAt: -1 }); 
        
        if (latestUser) {
            res.render('confirmation', { user: latestUser });
        } else {
            res.send("No registration details found. Please register first.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching confirmation.");
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// --- DATABASE CONNECTION ---
// Using MongoDB Atlas Connection String provided by user
const dbURI = "mongodb+srv://720723110803_db_user:darling%40123@cluster0.ddwhmyt.mongodb.net/symposiumDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(dbURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
    });

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
app.use(express.static('public')); // Serve static files like CSS/Images
app.set('view engine', 'ejs');

// --- ROUTES ---

// ROOT: Render Login Page First (Entry Point)
app.get('/', (req, res) => {
    res.render('login');
});

// LOGOUT: Redirect to Login Page
app.get('/logout', (req, res) => {
    // In a stateless app, we just redirect to login
    res.redirect('/');
});

// LOGIN POST: Save login attempt and redirect to Home
app.post('/login', async (req, res) => {
    try {
        const newLogin = new LoginEntry({
            email: req.body.email,
            phone: req.body.phone
        });
        await newLogin.save();
        console.log(`Login attempt saved for: ${req.body.email}`);
        
        // Check if this user is already registered to toggle the button state in home
        const existingUser = await User.findOne({ 
            $or: [{ email: req.body.email }, { phone: req.body.phone }] 
        });

        // Pass 'registered' flag to home via query parameter
        const isRegistered = !!existingUser;
        res.redirect(`/home?registered=${isRegistered}`); 

    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing login.");
    }
});

// HOME: Render Home Page (Dashboard)
app.get('/home', (req, res) => {
    // Check for query parameter 'registered' to determine button state
    const isRegistered = req.query.registered === 'true';
    res.render('home', { registered: isRegistered });
});

// REGISTER GET: Render Registration Form
app.get('/register', (req, res) => {
    res.render('register');
});

// REGISTER POST: Save User and Render SUCCESS Page
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

        // ALWAYS Render Success Page
        // Passing 'name' variable to be used in success.ejs
        res.render('success', { name: user.name }); 

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).send("Error registering user: " + err.message);
    }
});

// CONFIRMATION GET: Display details of the registered user
app.get('/confirmation', async (req, res) => {
    try {
        // Logic to get the correct user. 
        // For this demo, we get the last registered/updated user.
        // In a production app with sessions, use req.session.userId
        const latestUser = await User.findOne().sort({ registeredAt: -1 }); // Get the last registered user
        
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
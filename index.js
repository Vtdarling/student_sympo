const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// --- CONFIG ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// --- DB CONNECTION ---
// Remember to use %40 if your password has an @ symbol
const dbURI = "mongodb+srv://720723110803_db_user:darling%40123@cluster0.ddwhmyt.mongodb.net/symposiumDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(dbURI)
    .then(() => console.log("✅ Database Connected"))
    .catch(err => console.log("❌ Connection Error:", err));

// --- SCHEMA ---
const studentSchema = new mongoose.Schema({
    name: String,
    college: String,
    email: String,
    phone: String,
    events: [String],
    timestamp: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// --- ROUTES ---

// 1. Landing Page (Home)
app.get('/', (req, res) => {
    res.render('home'); // Looks for views/home.ejs
});

// 2. Registration Page
app.get('/register', (req, res) => {
    res.render('register'); // Looks for views/register.ejs
});

// 3. Handle Form
app.post('/register', async (req, res) => {
    try {
        const newStudent = new Student({
            name: req.body.name,
            college: req.body.college,
            email: req.body.email,
            phone: req.body.phone,
            events: req.body.events || []
        });
        await newStudent.save();
        res.render('success', { name: req.body.name });
    } catch (err) {
        console.error(err);
        res.send("Error saving data.");
    }
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));


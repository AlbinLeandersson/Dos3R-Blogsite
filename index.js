const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const PORT = 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Body parser middleware to handle POST request data
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: '#)%&=/)(%&=¤(/&%/(=TR=(/TGRF¤(/=%R=(/%&#/(=%&#',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the public directory
app.use(express.static('public'));

let posts = [];
let users = [];

// Authentication middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/login'); // Redirect to login page if user is not logged in
    } else {
        next(); // Proceed to next middleware or route handler
    }
};

// Password validation function
const isValidPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return password.length >= minLength && hasUpperCase && hasNumber;
};

// Render homepage
app.get('/', (req, res) => {
    const reversedPosts = posts.slice().reverse();
    res.render('index', { posts: reversedPosts, username: req.session.user ? req.session.user.username : null });
});

// Render the user registration form
app.get('/register', (req, res) => {
    const message = req.session.message;
    delete req.session.message;
    res.render('register', { username: req.session.user ? req.session.user.username : null, message });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const existingUser = users.find(user => user.username === username);

    if (existingUser) {
        req.session.message = { type: 'error', content: 'User already exists' };
        return res.redirect('/register');
    }

    if (!isValidPassword(password)) {
        req.session.message = { type: 'error', content: 'Password must be at least 8 characters long, contain at least one uppercase letter, and one number' };
        return res.redirect('/register');
    }

    const newUser = { username, password, description: '' }; // Initialize description
    users.push(newUser);
    req.session.message = { type: 'success', content: 'Registration successful! Please log in.' };
    res.redirect('/login');
});


// Render login form
app.get('/login', (req, res) => {
    const message = req.session.message;
    delete req.session.message;
    res.render('login', { username: req.session.user ? req.session.user.username : null, message });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        req.session.user = user;
        req.session.message = { type: 'success', content: 'Login successful!' };
        res.redirect('/profile');
    } else {
        req.session.message = { type: 'error', content: 'Invalid username or password' };
        res.redirect('/login');
    }
});


// Handle GET request to render the profile page
app.get('/profile', requireLogin, (req, res) => {
    const username = req.session.user ? req.session.user.username : null;
    const userDescription = req.session.user ? req.session.user.description : '';
    const message = req.session.message;
    delete req.session.message;
    res.render('profile', { username, userDescription, message });
});

// Handle POST request to update user description
app.post('/profile', requireLogin, (req, res) => {
    const { description } = req.body;

    if (!req.session.user) {
        return res.redirect('/login');
    }

    // Update user's description in session
    req.session.user.description = description;

    // Update user's description in the users array
    const user = users.find(user => user.username === req.session.user.username);

    if (user) {
        user.description = description;
    }

    res.redirect('/profile'); // Redirect back to profile page
});

// Render the page to create a new post (require login)
app.get('/post', requireLogin, (req, res) => {
    res.render('post', { username: req.session.user ? req.session.user.username : null });
});

// Handle creating a new post (require login)
app.post('/post', requireLogin, (req, res) => {
    const { title, content } = req.body;
    const author = req.session.user ? req.session.user.username : 'Anonymous'; // Use username if logged in
    posts.push({ title, content, author });
    res.redirect('/');
});

app.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    const post = posts[id];
    res.render('edit', { id, post, username: req.session.user ? req.session.user.username : null });
});

// Handle updating an existing post
app.post('/edit/:id', (req, res) => {
    const id = req.params.id;
    const { title, content } = req.body;

    // Validate the post ID
    if (id >= 0 && id < posts.length) {
        const post = posts[id];
        posts[id] = { title, content, author: post.author }; // Preserve the author
    }

    res.redirect('/userPosts');
});

// Handle deleting a post
app.post('/delete/:id', (req, res) => {
    const id = req.params.id;
    posts.splice(id, 1);
    res.redirect('/userPosts');
});

// Render the user's posts
app.get('/userPosts/:username', (req, res) => {
    const { username } = req.params;
    const userPosts = posts.filter(post => post.author === username);
    const isOwner = req.session.user && req.session.user.username === username;

    res.render('userPosts', { username, userPosts, isOwner });
});

// Handle user logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/login'); // Redirect to login page after logout
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

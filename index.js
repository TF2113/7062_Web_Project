const express = require('express');
const path = require('path');
const app = express();
const session = require('express-session');

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// GET request for login page
app.get('/', (req, res) => {
  res.render('login');
});

// POST request for login
app.post('/login', (req, res) => {
  const snumber = req.body.snumber;
  const password = req.body.password;

  if (snumber === 'user' && password === 'password') {
    req.session.snumber = snumber;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid credentials. <a href="/">Try again</a>');
  }
});

// GET request for dashboard (protected route)
app.get('/dashboard', (req, res) => {
  if (!req.session.snumber) {
    return res.redirect('/'); // If the user is not logged in, redirect to login page
  }
  
  // Render the dashboard
  res.send(`Welcome to your dashboard, ${req.session.snumber}! <a href="/logout">Logout</a>`);
});

// GET request for logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error during logout');
    }
    res.redirect('/'); // Redirect to login page after logout
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

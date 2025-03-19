const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

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

// Dummy user database
const users = {
  'user': { name: 'John Doe', password: 'password' },
  'admin': { name: 'Admin User', password: 'admin123' }
};

// Routes
app.get('/', (req, res) =>  {
   res.render('login')
  });

app.post('/login', (req, res) => {
  const { snumber, password } = req.body;

  if (users[snumber] && users[snumber].password === password) {
    req.session.snumber = snumber;
    req.session.name = users[snumber].name;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid credentials. <a href="/">Try again</a>');
  }
});

app.get('/dashboard', (req, res) => {
  if (!req.session.snumber) {
    return res.redirect('/');
  }

  res.render('dashboard', {
    snumber: req.session.snumber,
    name: req.session.name
  });
});


app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error during logout');
    }
    res.redirect('/');
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    res.render('login2'); 
});

app.post('/login', (req, res) => {
    res.send('Login POST request received');
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

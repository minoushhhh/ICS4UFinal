import express from 'express';
import path from 'path';
import ejs from 'ejs';
import bodyParser from 'body-parser';

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

const __dirname = path.resolve();

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/index', (req, res) => {
    res.render('index');
});

app.get('/booking', (req, res) => {
    res.render('booking');
});

app.get('/estimate', (req, res) => {
    res.render('estimate');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/sign-up', (req, res) => {
    res.render('sign-up');
})

app.get('/log-in', (req, res) => {
    res.render('log-in');
})

app.get('/profile', (req, res) => {
    res.render('profile');
})

app.get('/test', (req, res) => {
    res.render('test');
})

app.listen(3000, () => {
    console.log('Express server initialized');
});
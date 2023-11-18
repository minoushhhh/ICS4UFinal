import express from 'express';
import path from 'path';
import ejs from 'ejs';
import bodyParser from 'body-parser';

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('view engine', 'ejs');

const __dirname = path.resolve();

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/index', (req, res) => {
    res.render('index');
});

app.listen(3000, () => {
    console.log('Express server initialized');
  });
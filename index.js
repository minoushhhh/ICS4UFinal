import express from 'express';
import path from 'path';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import {MongoClient, ServerApiVersion} from 'mongodb';

const uri = "mongodb+srv://Admin:nR18eHCkif6yvno0@cluster0.ak6hid0.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
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
});

app.get('/log-in', (req, res) => {
    res.render('log-in');
});

app.get('/profile', (req, res) => {
    res.render('profile');
});

app.post('/submit-form', async (req, res) => {
  try {
    const formData = req.body;
    console.log(formData);

    await saveDetails(formData);
    
    res.redirect('/');
  } 
  catch (error) {
    console.error(error);
    res.send('Error submitting details, try again.');
  }
});

app.listen(3000, () => {
    console.log('Express server initialized');
});

//Saving the user details to the database by connecting to it and inserting the form details.
async function saveDetails(formData) {
  try {

    await client.connect();
    const database = client.db("user-details");
    const details = database.collection("details");

    const result = await details.insertOne(formData);

    console.log("User details sumbitted");

  } finally {
    await client.close();
  }
}
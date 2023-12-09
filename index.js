import express from 'express';
import path from 'path';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import { MongoClient, ServerApiVersion } from 'mongodb';

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

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/profile', (req, res) => {
  res.render('profile');
});

app.post('/login-form', async (req, res) => {
  try {
    const user = req.body.username + "";
    const pass = req.body.password + "";

    console.log(user + " " + pass);

    try {
      await client.connect();

      const database = client.db("user-details");
      const details = database.collection("details");

      let query;

      if (user.includes("@")) {
        const email = { email: user };
        query = await details.findOne(email);
        if (query === null) {
          res.send("User or Email not found");
          return;
        }
      }
      else {
        const username = { username: user };
        query = await details.findOne(username);
        if (query === null) {
          res.send("User or Email not found");
          return;
        }
      }

      const detailsDoc = await details.findOne(query)

      if (detailsDoc) {
        const password = detailsDoc.password;
        if (password == pass) {
          console.log("Correct password");
          res.redirect("/");
        }
        else {
          console.log("Incorrect password");
          res.send("Incorrect password.");
          return;
        }
      }
    }
    finally {
      await client.close();
    }
  }
  catch (error) {
    console.error(error);
    res.send("Login failed, try again.");
    return;
  }
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

app.get('/test', (req, res) => {
  res.render('test');
})

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
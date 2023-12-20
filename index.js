import express from 'express';
import path from 'path';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import { MongoClient, ServerApiVersion } from 'mongodb';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const uri = "mongodb+srv://Admin:nR18eHCkif6yvno0@cluster0.ak6hid0.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: "thisisasecretkey",
  saveUninitialized: true,  
  cookie: { maxAge: 86400000 },
  resave: false
}))
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate'); //So that user cannot logout and then still be logged in using the back button in their browser.
  res.locals.isLoggedIn = req.session.username !== undefined;
  next();
});

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
  const passValid = req.session.passValid;
  const userValid = req.session.userValid;
  const emailValid = req.session.emailValid;
  console.log("Variables in session " + passValid, userValid, emailValid);
  res.render('login', { passValid, userValid, emailValid });
});

app.get('/profile', (req, res) => {
  const userData = req.session.userData;
  console.log("Username in session:", req.session.username);
  if (req.session.username) {
    const name = req.session.username;
    res.render('profile', { userData, name });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    } else {
      res.locals.isLoggedIn = false;
      res.redirect('/login');
    }
  });
});

app.post('/login-form', async (req, res) => {
  try {
    const user = req.body.username + "";
    const pass = req.body.password + "";

    console.log(user + " " + pass);

    await checkLogin(user, pass, req, res);   

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

    let usernameTaken = await checkValidUsername(req.body.username);

    if (usernameTaken === false) {
      console.log(formData);

      await saveDetails(formData);

      req.session.username = formData.firstName;
      req.session.userData = {
        lastName: formData.lastName,
        email: formData.email,
        phoneNum: formData.phoneNumber,
        adr: formData.address,
        pCode: formData.postalCode,
        userName: formData.username,
        passWord: formData.password,
      };
  
      res.redirect('/profile');
    }
    else {
      res.send("Username Taken");
    }
  }
  catch (error) {
    console.error(error);
    res.send('Error submitting details, try again.');
  }
});

app.listen(3000, () => {
  console.log('Express server initialized');
});

//Check login information when logged in
async function checkLogin(user, pass, req, res) {
  console.log("Checking login info...");
  try {
    await client.connect();

    const database = client.db("user-details");
    const details = database.collection("details");

    let query;

    if (user.includes("@")) {
      const email = { email: user };
      query = await details.findOne(email);
      if (query === null) {
        console.log("email not found");
        req.session.emailValid = false;
        req.session.passValid = true;
        req.session.userValid = true;
        res.redirect("/login");
        return;
      }
    } else {
      const username = { username: user };
      query = await details.findOne(username);
      if (query === null) {
        console.log("user not found");
        req.session.userValid = false;
        req.session.passValid = true;
        req.session.emailValid = true;
        res.redirect("/login");
        return;
      }
    }

    const detailsDoc = await details.findOne(query);

    if (detailsDoc) {
      const password = detailsDoc.password;
      if (password == pass) {
        req.session.username = detailsDoc.firstName;
        req.session.userData = {
          lastName: detailsDoc.lastName,
          email: detailsDoc.email,
          phoneNum: detailsDoc.phoneNumber,
          adr: detailsDoc.address,
          pCode: detailsDoc.postalCode,
          userName: detailsDoc.username,
          passWord: detailsDoc.password,
        };
        console.log("Correct password");
        res.redirect('/profile');
        return;
      } else {
        console.log("Incorrect password");
        req.session.passValid = false;
        req.session.emailValid = true;
        req.session.userValid = true;
        res.redirect("/login");
        return;
      }
    }
  } finally {
    await client.close();
  }
}

//Saving the user details to the database by connecting to it and inserting the form details.
async function saveDetails(formData) {
  try {
    console.log("Connecting to Database");

    await client.connect();
    const database = client.db("user-details");
    const details = database.collection("details");

    await details.insertOne(formData);

    console.log("User details sumbitted to Database");

  } finally {
    await client.close();
  }
}

//Checking for unique username so that there aren't duplicate users.
async function checkValidUsername(user) {
  console.log("Checking username...");

  await client.connect();
  const database = client.db("user-details");
  const details = database.collection("details");

  let query = await details.findOne({username: user});

  if (query) {
    //console.log("duplicate user found");
    return true;
  }
  else {
    //console.log("user valid!");
    return false;
  }
}
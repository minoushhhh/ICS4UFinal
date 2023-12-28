import express from 'express';
import path from 'path';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import { MongoClient, ServerApiVersion } from 'mongodb';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';

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
}));
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
  const usernameTaken = req.session.usernameTaken;
  res.render('sign-up', { usernameTaken });
});

app.get('/login', (req, res) => {
  let loginInvalid = req.session.loginInvalid;
  if (req.session.username) {
    res.redirect('/');
  } else {
    console.log("Login invalid", loginInvalid);
    res.render('login', { loginInvalid });
  }
});

app.get('/profile', (req, res) => {
  console.log("Username in session:", req.session.username);
  if (req.session.username) {
    const userData = req.session.userData;
    res.render('profile', { userData });
  }
  else {
    res.redirect('/login');
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

    await checkLogin(user, pass, req, res);

  }
  catch (error) {
    console.error(error);
    res.send("Login failed, try again.");
    return;
  }
});

app.post('/save-form', async (req, res) => {
  try {
    const updates = req.body;
    const username = req.body.username;
    console.log(username);
    await updateDetails(updates, username, req);
    res.redirect('/profile');
  } finally {
    await client.close();
  }
});

async function sendEmail(customerEmail, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mapleglowdetailing@gmail.com ',
      pass: 'lfcp rjsv xbkn vfan' //App password for mapleglowdetailing@gmail.com account.
    }
  });

  const emailLayout = {
    from: 'mapleglowdetailing@gmail.com',
    to: ["owenhuang623@gmail.com", "liamzhan2006@gmail.com", "shethmohnish@gmail.com"],
    subject: subject,
    text: "Customer Inquiry from " + customerEmail + ": " + text
  };

  transporter.sendMail(emailLayout, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    }
  });
}

app.post('/contact-form', (req, res) => {
  const subject = req.body.subject;
  const message = req.body.message;
  const customerEmail = req.body.email;

  sendEmail(customerEmail, subject, message);

  console.log("Sent e-mail sucessfully");

  res.redirect("/contact");

});

async function updateDetails(formData, user, req) {
  try {
    console.log("Connecting to update server...");

    await client.connect();
    const database = client.db("user-details");
    const details = database.collection("details");

    const query = { username: user };

    console.log("Updated details sent to DB:", formData);

    const result = await details.updateOne(query, { $set: formData });

    if (result.matchedCount === 1 && result.modifiedCount === 0) {
      console.warn("Update did not modify any fields.");
    } else {
      console.log("Update completed successfully.");

      req.session.userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNum: formData.phoneNumber,
        adr: formData.address,
        pCode: formData.postalCode,
        userName: formData.username,
        passWord: formData.password,
      };
    }
  } catch (error) {
    console.error("Error updating details:", error);
    throw error;
  } finally {
    await client.close();
  }
}

app.post('/sign-up-form', async (req, res) => {
  try {
    const formData = req.body;

    let usernameTaken = await checkValidUsername(req.body.username);

    if (usernameTaken === false) {
      console.log(formData);

      await saveDetails(formData);

      req.session.username = formData.username;
      req.session.userData = {
        firstName: formData.firstName,
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
      req.session.usernameTaken = true;
      console.log("username taken.");
      res.redirect('/sign-up');
      return;
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
        req.session.loginInvalid = true;
        res.redirect('/login');
        return;
      }
    } else {
      const username = { username: user };
      query = await details.findOne(username);
      if (query === null) {
        console.log("user not found");
        req.session.loginInvalid = true;
        res.redirect("/login");
        return;
      }
    }

    const detailsDoc = await details.findOne(query);

    if (detailsDoc) {
      const password = detailsDoc.password;
      if (password == pass) {
        req.session.username = detailsDoc.username;
        req.session.userData = {
          firstName: detailsDoc.firstName,
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
        req.session.loginInvalid = true;
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

  let query = await details.findOne({ username: user });

  if (query) {
    return true;
  }
  else {
    return false;
  }
}

//Reading admin database
async function getAdminSchedule() {
  console.log("Trying to get schedule");
  try {
    await client.connect();

    const database = client.db("user-details");
    const adminScheduleCollection = database.collection("adminSchedule");

    // Use findOne to retrieve a single document from the adminSchedule collection
    const adminSchedule = await adminScheduleCollection.findOne({});

    return adminSchedule;
  } finally {
    await client.close();
  }
}

app.get('/admin-schedule', async (req, res) => {
  try {
    const adminSchedule = await getAdminSchedule();
    res.json(adminSchedule);
  } catch (error) {
    console.error("Error getting admin schedule:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
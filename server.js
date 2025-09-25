const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // serve index.html etc.

// Path to store users
const usersFile = path.join(__dirname, "users.json");

// Ensure users.json exists
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([]));
}

// ===================
// ROUTES
// ===================

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Registration handler
app.post("/register", (req, res) => {
  const { name, email, phone, state, farm, message, password } = req.body;

  if (!email || !name) {
    return res.status(400).send("Missing required fields");
  }

  let users = JSON.parse(fs.readFileSync(usersFile));

  // check if user already exists
  if (users.find((u) => u.email === email)) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>User Exists</title>
        <style>
          body { 
            display:flex; justify-content:center; align-items:center; height:100vh;
            font-family: Arial, sans-serif; background: #ffe6e6; margin:0;
          }
          .card { background:#fff; padding:2rem; border-radius:12px; text-align:center;
            box-shadow:0 6px 20px rgba(0,0,0,0.1); max-width:400px;
          }
          h2 { color:#d32f2f; }
          a { display:inline-block; margin-top:1rem; padding:0.7rem 1.5rem;
            background:#d32f2f; color:#fff; text-decoration:none; border-radius:6px;
          }
          a:hover { background:#9a0007; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>⚠️ User Already Registered</h2>
          <p>Please login with your existing account.</p>
          <a href="/login.html">Go to Login</a>
        </div>
      </body>
      </html>
    `);
  }

  // Save user
  const newUser = { name, email, phone, state, farm, message, password };
  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Registration Success</title>
      <style>
        body {
          background: linear-gradient(135deg, #d4fc79, #96e6a1);
          font-family: Arial, sans-serif;
          display:flex; justify-content:center; align-items:center; height:100vh; margin:0;
        }
        .card {
          background:#fff; padding:2.5rem; border-radius:12px; text-align:center;
          box-shadow:0 6px 20px rgba(0,0,0,0.1); max-width:400px;
        }
        h2 { color:#0b7b3b; }
        a { display:inline-block; margin-top:1rem; padding:0.7rem 1.5rem;
          background:#0b7b3b; color:#fff; text-decoration:none; border-radius:6px;
        }
        a:hover { background:#095c2e; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>✅ Registration Successful!</h2>
        <p>Your account has been created successfully.</p>
        <a href="/login.html">Go to Login</a>
      </div>
    </body>
    </html>
  `);
});

// Login handler
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let users = JSON.parse(fs.readFileSync(usersFile));

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Login Failed</title>
        <style>
          body { 
            display:flex; justify-content:center; align-items:center; height:100vh;
            font-family: Arial, sans-serif; background: #ffe6e6; margin:0;
          }
          .card { background:#fff; padding:2rem; border-radius:12px; text-align:center;
            box-shadow:0 6px 20px rgba(0,0,0,0.1); max-width:400px;
          }
          h2 { color:#d32f2f; }
          a { display:inline-block; margin-top:1rem; padding:0.7rem 1.5rem;
            background:#d32f2f; color:#fff; text-decoration:none; border-radius:6px;
          }
          a:hover { background:#9a0007; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>❌ Login Failed</h2>
          <p>Invalid email or password. Please try again.</p>
          <a href="/login.html">Try Again</a>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <script>
      localStorage.setItem("loggedInUser", '${JSON.stringify(user)}');
      window.location.href = "/dashboard.html";
    </script>
  `);
});

// ===================
// REVIEWS
// ===================
let reviews = []; // temporary storage

app.post("/api/reviews", (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: "Name and message required" });
  }
  const review = { name, message, date: new Date() };
  reviews.push(review);
  res.json({ success: true, review });
});

app.get("/api/reviews", (req, res) => {
  res.json(reviews);
});

// ===================
// START SERVER
// ===================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

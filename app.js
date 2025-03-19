const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const app = express();

// MySQL Database connection pool
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root", // Your DB password
  database: "40432835", // Your DB name
  port: 3306,
});

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Routes

// Login page
app.get("/", (req, res) => {
  res.render("login", {
    error: req.query.error,
    signupError: req.query.signupError,
  });
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { snumber, password } = req.body;

  // Check the database for the student number and password
  db.query(
    "SELECT * FROM students WHERE student_number = ?",
    [snumber],
    (err, results) => {
      if (err) {
        return res.send("Database error");
      }

      if (results.length === 0) {
        return res.redirect("/?error=Invalid student number or password");
      }

      const user = results[0];

      // Compare the hashed password with the user input
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.send("Error during password comparison");
        }

        if (isMatch) {
          req.session.snumber = user.student_number;
          req.session.name = user.name;
          res.render("dashboard", {
            student_number: user.student_number,
            student_name: user.first_name + " " + user.last_name,
          });
        } else {
          res.redirect("/?error=Invalid student number or password");
        }
      });
    }
  );
});

// Handle sign-up form submission
app.post("/signup", (req, res) => {
  const { new_snumber, new_password } = req.body;
  console.log(req.body);
  console.log("Student Number:", new_snumber);
  console.log("Password:", new_password);

  if (!new_snumber || !new_password) {
    return res.send("Missing student number or password");
  }

  // Normalize and trim the student number before checking
  const normalizedSNumber = new_snumber.trim().toUpperCase();
  console.log("Normalized Student Number:", normalizedSNumber);

  // Check if the student number exists in the database
  db.query(
    "SELECT * FROM students WHERE student_number = ?",
    [normalizedSNumber],
    (err, results) => {
      if (err) {
        return res.send("Database error");
      }

      if (results.length === 0) {
        return res.redirect("/?signupError=Student number does not exist");
      }

      // Hash the password before updating
      bcrypt.hash(new_password, 10, (err, hashedPassword) => {
        if (err) {
          return res.send("Error during password hashing");
        }

        // Update the user's password in the database
        db.query(
          "UPDATE students SET password = ? WHERE student_number = ?",
          [hashedPassword, normalizedSNumber],
          (err) => {
            if (err) {
              return res.send("Error during password update");
            }

            res.redirect("/");
          }
        );
      });
    }
  );
});

// Dashboard page
app.get("/dashboard", (req, res) => {
  if (!req.session.snumber) {
    return res.redirect("/");
  }

  res.render("dashboard", {
    snumber: req.session.snumber,
    name: req.session.name,
  });
});

// Handle logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Error during logout");
    }
    res.redirect("/");
  });
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

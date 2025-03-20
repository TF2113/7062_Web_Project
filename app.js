const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const app = express();
const calculateAverageGrade = require("./utils/calculateAverageGrade");

// Database connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "40432835",
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
app.post("/login", async (req, res) => {
  const { snumber, password } = req.body;

  try {
    const [results] = await db
      .promise()
      .query("SELECT * FROM students WHERE student_number = ?", [snumber]);

    if (results.length === 0) {
      return res.redirect("/?error=Invalid student number or password");
    }

    const user = results[0];

    // Compare the hashed password with the user input
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Store user info in session
      req.session.snumber = user.student_number;
      req.session.name = user.first_name + " " + user.last_name;

      // Redirect to dashboard (the query will be handled there)
      res.redirect("/dashboard");
    } else {
      res.redirect("/?error=Invalid student number or password");
    }
  } catch (err) {
    return res.send("Database error: " + err);
  }
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
app.get("/dashboard", async (req, res) => {
  if (!req.session.snumber) {
    return res.redirect("/");
  }

  const snumber = req.session.snumber;

  try {
    // Fetch student modules
    const [studentModules] = await db
      .promise()
      .query(
        "SELECT student_modules.* FROM student_modules JOIN students ON students.student_number = ? AND student_modules.student_id = students.student_id ORDER BY student_modules.academic_year",
        [snumber]
      );

      const averageGrade = calculateAverageGrade(studentModules);
      console.log(averageGrade)
    // Fetch subjects for student modules
    const [studentSubjects] = await db
      .promise()
      .query(
        "SELECT subjects.module_title FROM subjects JOIN student_modules ON student_modules.subject_id = subjects.subject_id JOIN students ON students.student_id = student_modules.student_id WHERE students.student_number = ?",
        [snumber]
      );

    // Pass data to the dashboard view
    res.render("dashboard", {
      snumber: req.session.snumber,
      student_name: req.session.name,
      average: averageGrade,
      student_results: studentModules,
      student_subjects: studentSubjects,
    });
  } catch (err) {
    return res.send("Database error: " + err);
  }
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

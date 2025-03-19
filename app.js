const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const app = express();

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
      const [studentModules] = await db
        .promise()
        .query(
          "SELECT student_modules.* FROM student_modules JOIN students ON students.student_number = ? AND student_modules.student_id = students.student_id",
          [snumber]
        );

      let totalGrades = 0;
      let gradeCount = 0;

      studentModules.forEach((result) => {
        let gradeToAdd = 0;
        if (
          result.first_result === "fail" ||
          result.first_result === "excused" ||
          result.first_result === "absent"
        ) {
          if (result.resit_result === "pass capped") {
            gradeToAdd = 40; // If resit result is 'pass capped', assign 40
          } else if (
            result.resit_grade !== undefined &&
            result.resit_grade !== null
          ) {
            gradeToAdd = parseInt(result.resit_grade, 10);
          }
        } else if (result.first_result === "pass capped") {
          gradeToAdd = 40;
        } else if (
          result.first_grade !== undefined &&
          result.first_grade !== null
        ) {
          gradeToAdd = parseInt(result.first_grade, 10);
        }
        if (gradeToAdd !== 0) {
          totalGrades += gradeToAdd;
          gradeCount++;
        }
      });

      let averageGrade = gradeCount > 0 ? totalGrades / gradeCount : 0;

      let progressBarColour;
      if (averageGrade >= 70) {
        progressBarColour = "#4CAF50"; // Green
      } else if (averageGrade >= 50) {
        progressBarColour = "#FFC107"; // Yellow
      } else {
        progressBarColour = "#F44336"; // Red
      }

      const [subjects] = await db
        .promise()
        .query(
          "SELECT subjects.module_title FROM subjects JOIN student_modules ON student_modules.subject_id = subjects.subject_id JOIN students ON students.student_id = student_modules.student_id WHERE students.student_number = ?",
          [snumber]
        );

      res.render("dashboard", {
        student_number: user.student_number,
        student_name: user.first_name + " " + user.last_name,
        student_results: studentModules,
        student_subjects: subjects,
        average: averageGrade,
        progressColour: progressBarColour
      });
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

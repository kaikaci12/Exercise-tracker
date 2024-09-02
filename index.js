const express = require("express");
const { body, validationResult, matchedData } = require("express-validator");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { mongoose } = require("mongoose");
require("dotenv").config();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));

mongoose
  .connect("mongodb://localhost:27017/FreeCodeCamp")
  .then(() => console.log("connected to the database"))
  .catch((e) => console.log(e));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const { User, Exercise } = require("./schemas/User.js");

app.post("/api/users", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Please provide a username" });
  }

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // If not, create a new user
    const newUser = await User.create({ username });
    res.status(201).json({
      username: newUser.username,
      _id: newUser._id,
    });
  } catch (error) {
    // Handle any other errors
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

const moment = require("moment");

app.post(
  "/api/users/:_id/exercises",
  [
    body("description").notEmpty().withMessage("Description cannot be empty"),
    body("duration")
      .notEmpty()
      .withMessage("Duration is required")
      .isNumeric()
      .withMessage("Duration must be a number"),
    body("date")
      .optional()
      .custom((value) => {
        if (value && !moment(value, "YYYY-MM-DD", true).isValid()) {
          throw new Error("Invalid date format, please use YYYY-MM-DD");
        }
        return true;
      }),
  ],
  async (req, res) => {
    const userId = req.params._id;
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const data = matchedData(req);
    let { description, duration, date } = data;

    // If no date is provided, use the current date
    if (!date) {
      date = new Date();
    } else {
      date = new Date(date);
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ error: `User with ID ${userId} not found` });
      }

      const exercise = {
        description,
        duration: parseInt(duration),
        date: date.toDateString(), // Convert to a readable string
      };
      user.exercises.push(exercise); // Add exercise to the user's exercises array
      await user.save(); // Save the user document
      // await Exercise.create({
      //   _id: user._id,
      //   username: user.username,
      //   description: description,
      //   duration: parseInt(duration),
      //   date: exercise.date,
      // });

      res.status(200).json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date,
      });
    } catch (error) {
      res.status(500).json({ error: "Server error: " + error.message });
    }
  }
);

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;

  try {
    // Find the user by ID and return only the necessary fields
    const user = await User.findById(userId);
    console.log(user);

    if (!user) {
      return res
        .status(404)
        .json({ error: `User with ID ${userId} not found` });
    }

    // Build the log array from the user's exercises
    const log = user.exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    }));

    // Return the log along with the count
    res.status(200).json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});
app.get("/api/users/:_id/logs/:from?/:to?/:limit?", async (req, res) => {
  const { from, to, limit } = req.params;
  const userId = req.params._id;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ error: `User with ID ${userId} not found` });
    }

    // Parse the 'from' and 'to' dates if provided
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    // Filter exercises based on the date range
    let filteredExercises = user.exercises.filter((exercise) => {
      const exerciseDate = new Date(exercise.date);
      return (
        (!fromDate || exerciseDate >= fromDate) &&
        (!toDate || exerciseDate <= toDate)
      );
    });

    // Limit the number of exercises if 'limit' is provided
    if (limit) {
      filteredExercises = filteredExercises.slice(0, parseInt(limit));
    }

    // Build the log array
    const log = filteredExercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    }));

    // Return the log along with the count
    res.status(200).json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

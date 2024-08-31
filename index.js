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

const User = require("./schemas/User.js");

app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(401).send({ error: "please provide the username" });
  }
  const newUser = await User.create({
    username: username,
  });
  res.status(200).json({
    username,
    _id: newUser._id,
  });
});
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
      .optional() // Allow date to be optional
      .isDate()
      .withMessage("Invalid date format"),
  ],
  async (req, res) => {
    const userId = req.params._id;
    const result = validationResult(req);

    // Handle validation errors
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const data = matchedData(req);
    const { description, duration, date } = data;

    try {
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ error: `User with ID ${userId} not found` });
      }

      // Update the user's document
      user.description = description;
      user.duration = duration;
      user.date = date
        ? new Date(date).toDateString()
        : new Date().toDateString(); // Use current date if not provided

      // Save the updated document
      const updatedUser = await user.save();

      // Send back the updated user data
      res.status(200).json({
        id: updatedUser._id,
        username: updatedUser.username,
        description: updatedUser.description,
        duration: updatedUser.duration,
        date: updatedUser.date,
      });
    } catch (error) {
      // Handle errors properly
      res.status(500).json({ error: "Server error: " + error.message });
    }
  }
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

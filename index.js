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
  const newUser = await User.create({
    username: username,
  });
});
app.post(
  "/api/users/:_id/exercises",
  [
    body("description").notEmpty().withMessage("description cannot be empty"),
    body("duration")
      .notEmpty()
      .withMessage("duration is required")
      .isNumeric()
      .withMessage("duration must be a number"),
    body("date")
      .notEmpty()
      .withMessage("date cannot be empty")
      .isDate()
      .withMessage("Invalid date format"),
  ],
  async (req, res) => {
    const userId = req.params._id;
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).send({ errors: result.array() });
    }

    const data = matchedData(req);
    const { description, duration, date } = data;
    const findUser = await User.findById(userId);

    if (!findUser) {
      return res
        .status(404)
        .send(`User with the id of ${userId} doesn't exist`);
    }

    // Update the user's document
    findUser.description = description;
    findUser.duration = duration;
    findUser.date = new Date(date).toISOString(); // Format the date

    // Save the updated document
    const updatedUser = await findUser.save();

    res.status(200).json({
      username: updatedUser.username,
      description: updatedUser.description,
      duration: updatedUser.duration,
      date: updatedUser.date,
    });
  }
);
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

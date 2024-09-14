const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Create Schemas
const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
});

const userSchema = new mongoose.Schema({
  username: String,
});

const logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});

//Create Models
const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);
const Log = mongoose.model("Log", logSchema);

//Create Routes
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const user = new User({ username: username });
  user
    .save()
    .then((data) => {
      res.json({ username: data.username, _id: data._id });
    })
    .catch((err) => {
      res.json({ error: err });
    });
});
//Get all users
app.get("/api/users", (req, res) => {
  User.find({})
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ error: err });
    });
});
//Post exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id;
  let { description, duration, date } = req.body;
  User.findById(id)
    .then((data) => {
      const username = data.username;
      //Check if there is a date
      if (date === "" || date === undefined) {
        date = new Date().toDateString();
      }
      const newExercise = new Exercise({
        username: username,
        description: description,
        duration: duration,
        date: date,
      });
      newExercise
        .save()
        .then((data) => {
          res.json({
            _id: id,
            username: username,
            date: data.date,
            duration: data.duration,
            description: data.description,
          });
        })
        .catch((err) => {
          res.json({ error: err });
        });
    })
    .catch((err) => {
      res.json({ error: err });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

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
  description: String,
  duration: Number,
  date: String,
});

const userSchema = new mongoose.Schema({
  username: String,
});

const logSchema = new mongoose.Schema({
  user_id: String,
  count: Number,
  log: [
    {
      exercise_id: String,
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
      //Create user log
      const log = new Log({
        user_id: data._id,
        count: 0,
        log: [],
      });
      log
        .save()
        .then((logData) => {
          res.json({ username: data.username, _id: data._id });
        })
        .catch((err) => {
          console.log(err);
        });
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
            date: date,
            duration: +duration,
            description: description,
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

//Get exercises
app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  //Find user
  User.findById(id)
    .then((data) => {
      const username = data.username;
      //find user's exercises
      Exercise.find({ user_id: id })
        .then((data) => {
          const count = data.length;
          let log = data.map((item) => {
            return {
              description: item.description,
              duration: item.duration,
              date: item.date,
            };
          });
          if (from) {
            const fromDate = new Date(from);
            log = log.filter((exe) => new Date(exe.date) >= fromDate);
          }
          if (to) {
            const toDate = new Date(to);
            log = log.filter((exe) => new Date(exe.date) <= toDate);
          }
          if (limit) {
            log = log.slice(0, limit);
          }
          res.json({
            username: username,
            count: count,
            _id: id,
            log: log,
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

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
      } else {
        date = new Date(date).toDateString();
      }
      const newExercise = new Exercise({
        description: description,
        duration: duration,
        date: date,
      });
      newExercise
        .save()
        .then((exercise) => {
          //Add exercise to log
          Log.findOneAndUpdate(
            { user_id: id },
            {
              $inc: { count: 1 },
              $push: {
                log: {
                  exercise_id: exercise._id,
                  description: exercise.description,
                  duration: +exercise.duration,
                },
              },
            },
          )
            .then((result) => {
              res.json({
                _id: id,
                username: username,
                date: exercise.date,
                duration: +exercise.duration,
                description: exercise.description,
              });
            })
            .catch((err) => {
              res.json({ error: err });
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
  Log.findOne({ user_id: id })
    .then((data) => {
      //find user
      User.findById(data.user_id)
        .then((user) => {
          //Retrieve exercises information
          const exerciseIds = data.log.map((element) => element.exercise_id);
          Exercise.find({ _id: { $in: exerciseIds } })
            .then((exercises) => {
              //Filter exercises
              if (from) {
                const fromDate = new Date(from);
                exercises = exercises.filter(
                  (exe) => new Date(exe.date) >= fromDate,
                );
              }
              if (to) {
                const toDate = new Date(to);
                exercises = exercises.filter(
                  (exe) => new Date(exe.date) <= toDate,
                );
              }
              if (limit) {
                exercises = exercises.slice(0, limit);
              }
              res.json({
                _id: data.user_id,
                username: user.username,
                count: data.count,
                log: exercises,
              });
            })
            .catch((err) => {
              res.json({ error: err });
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

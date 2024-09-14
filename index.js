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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// es modules
// i guess the future of way it will be written
// must be type: module in package.json
import express from "express";
import bodyParser from "body-parser"; // may no longer be needed; crossed out in his IDE
import nanobuffer from "nanobuffer"; // limited array;
// 50 messages at end...
import morgan from "morgan"; // logger
// no-day-mon?

// set up a limited array
const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse(); // reverse? you want most recent messages at the top?

// feel free to take out, this just seeds the server with at least one message
msg.push({
  user: "kevin",
  text: "hi",
  time: Date.now(),
});

// get express ready to run
const app = express();
app.use(morgan("dev"));
app.use(bodyParser.json()); // may no longer be needed
app.use(express.static("frontend")); // woah, this is kind of insane...
// just run this, and frontend/index.html will be served

app.get("/poll", function (req, res) {
  // use getMsgs to get messages to send back
  // write code here
  res.json({
    msg: getMsgs(),
  });
});

app.post("/poll", function (req, res) {
  // add a new message to the server
  // write code here
  console.log("post!");
  const { user, text } = req.body;

  msg.push({
    user,
    text,
    time: Date.now(),
  });

  res.json({
    status: "ok",
  });
});

// start the server
const port = process.env.PORT || 3000;
app.listen(port);
console.log(`listening on http://localhost:${port}`);

import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";
import { Server } from "socket.io"; // this one comes from node_modules
// which now I'm wondering...why aren't we doing this for frontend??

const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

msg.push({
  user: "brian",
  text: "hi",
  time: Date.now(),
});

// serve static assets
const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: "./frontend",
  });
});

// code starts here
// #1. Hey I want to upgrade this server to accept websocket connection
const io = new Server(server, {});

// subtle awesomeness
// if you disconnect the server, and reconnect
// the connection gets automatically restored
// vs the websocket by hand method or vs polling backoff and retry
// built in out of the box;
// backoff/retry logic not fun, but out of the box with socket.io
io.on("connection", (socket) => {
  console.log(`connected: ${socket.id}`);
  // i.e. connected: yoDMoJHe_2X9RZA5AAAB

  // go send to FE these getMsgs() on their msg:get listener
  socket.emit("msg:get", { msg: getMsgs() }); // arbitrarily named

  socket.on("disconnect", () => {
    console.log(`disconnected: ${socket.id}`);
  });

  // msg:post must be in sync with FE
  socket.on("msg:post", (data) => {
    msg.push({
      user: data.user,
      text: data.text,
      time: Date.now(),
    });
    // rebroadcast
    // before: websocket by hand
    // loop through channels and run this function for each socket
    // now: io represents the server holding all the sockets
    io.emit("msg:get", { msg: getMsgs() });
  });
});

// code ends here

const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);

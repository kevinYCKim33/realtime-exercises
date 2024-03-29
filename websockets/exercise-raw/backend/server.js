import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";

// these are helpers to help you deal with the binary data that websockets use
// don't bother trying to understand these too in depth;
// let's just focus on the upgrade experience
import objToResponse from "./obj-to-response.js";
import generateAcceptValue from "./generate-accept-value.js";
import parseMessage from "./parse-message.js";

let connections = [];
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

// our code starts here
// upgrade request sent via FE's
// const ws = new WebSocket("ws://localhost:8080", ["json"]); // built into browser; not http protocol; ws;
server.on("upgrade", (req, socket) => {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }

  console.log("upgrade requested!");

  const acceptKey = req.headers["sec-websocket-key"];
  const acceptValue = generateAcceptValue(acceptKey);
  const headers = [
    "HTTP/1.1 101 Web Socket Protocol Handshake",
    "Upgrade: WebSocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptValue}`,
    "Sec-WebSocket-Protocol: json",
    "\r\n", // whitespace to let browser know this is the end
  ];

  socket.write(headers.join("\r\n")); // done sending you headers now browser!
  // now we can officially talk in websockets now!

  //     buffer
  // BE <==> FE
  // all comm both ways need to be encrypted in this weird Buffer format
  // <Buffer 81 a1 15 8b 8b ee 6e a9 fe 9d 70 f9 a9 d4 37 ea f8 8a 73 a9 a7 cc 61 ee f3 9a 37 b1 a9 9f 62 ee fa 99 70 fc fa cc 68>
  // the FE's WebSocket class takes care of all this;
  // BE is a lot of manual work

  // BE => FE
  // socket.write(<Buffer >)

  // FE => BE
  // ws.send(JSON.stringify(data)) // all of it gets converted to <Buffer > and sent to BE
  socket.write(objToResponse({ msg: getMsgs() }));
  connections.push(socket);

  // anytime we receive message from FE, this event listener will fire
  socket.on("data", (buffer) => {
    // <Buffer 81 9d cf 93 9d 74 b4 b1 e8 07 aa e1 bf 4e ed e2 f8 03 aa b1 b1 56 bb f6 e5 00 ed a9 bf 15 bc f7 fb 56 b2>
    console.log("buffer is: ", buffer);
    const message = parseMessage(buffer);

    if (message) {
      msg.push({
        user: message.user,
        text: message.text,
        time: Date.now(),
      });

      // so other browsers connected to server via websockets can get its messages too
      connections.forEach((socket) => {
        socket.write(objToResponse({ msg: getMsgs() }));
      });
    } else if (message === null) {
      socket.end();
    }
  });

  socket.on("end", () => {
    connections = connections.filter((s) => s !== socket);
  });
});
// our code ends here

const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);

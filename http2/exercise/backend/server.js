import http2 from "http2"; // not using express; getting lower level for fundamentals
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// from vercel
import handler from "serve-handler";
import nanobuffer from "nanobuffer";

let connections = [];

const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

msg.push({
  user: "brian",
  text: "hi",
  time: Date.now(),
});

// the two commands you'll have to run in the root directory of the project are
// (not inside the backend folder)
//
// openssl req -new -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem
// openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt
//
// http2 only works over HTTPS
// ^ and that's what all that hoopla are for...
// need certs for HTTP2...okay...
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = http2.createSecureServer({
  cert: fs.readFileSync(path.join(__dirname, "/../server.crt")),
  key: fs.readFileSync(path.join(__dirname, "/../key.pem")),
});

/*
 *
 * Code goes here
 *
 */

// writing on fly
server.on("stream", (stream, headers) => {
  const path = headers[":path"];
  const method = headers[":method"];

  // streams open for every request from the browser
  // this handles the initial case of user opening the app/page
  // and the FE calling getNewMsgs()
  if (path === "/msgs" && method === "GET") {
    console.log("only once!");
    // immediately reply with 200 OK and the encoding
    console.log("connected a stream! " + stream.id);
    stream.respond({
      ":status": 200,
      "content-type": "text/plain; charset=utf-8", // jsons don't stream very well; yaml does (though it sucks)
    });

    // congrats user, you connected to our stream!
    // here's all our messages right now in the msg array
    stream.write(JSON.stringify({ msg: getMsgs() }));
    connections.push(stream);

    stream.on("close", () => {
      console.log("disconnected " + stream.id);
      connections = connections.filter((s) => s !== stream);
    });
  }
});

// prewritten
server.on("request", async (req, res) => {
  const path = req.headers[":path"];
  const method = req.headers[":method"];

  if (path !== "/msgs") {
    // handle the static assets
    return handler(req, res, {
      public: "./frontend",
    });
  }
  // handling when any user posts a message
  else if (method === "POST") {
    console.log("posting!");
    // essentially bodyparser
    // get data out of post
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    const { user, text } = JSON.parse(data);

    msg.push({
      user,
      text,
      time: Date.now(),
    });

    res.end(); // why res.end() here??
    // all requests must end

    // hello every stream in the connections
    // all the streams now display all the messages with the newly msg just added in
    connections.forEach((stream) => {
      // could be written smarter than just dumping all messages in the array
      // but not the point of the exercise
      stream.write(JSON.stringify({ msg: getMsgs() }));
    });
  }
});

// start listening
const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(
    `Server running at https://localhost:${port} - make sure you're on httpS, not http`
  )
);

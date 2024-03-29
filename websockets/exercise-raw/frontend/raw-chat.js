const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const presence = document.getElementById("presence-indicator");
let allChat = [];

// listen for events on the form
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  // code goes here
  const data = { user, text };

  ws.send(JSON.stringify(data)); // send the json to websockets server
  // <Buffer 81 a1 15 8b 8b ee 6e a9 fe 9d 70 f9 a9 d4 37 ea f8 8a 73 a9 a7 cc 61 ee f3 9a 37 b1 a9 9f 62 ee fa 99 70 fc fa cc 68>
}

/*
 *
 * your code goes here
 *
 */
// will connect via HTTP/TCP/IP;
// hey endpoint! I want to upgrade this connection!
// will send upgrade request
// server: cool, I can speak websockets
// WebSocket object handles all this handshake stuff from frontend for you natively!
const ws = new WebSocket("ws://localhost:8080", ["json"]); // built into browser; not http protocol; ws;

// dang...on open...that's cool;

ws.addEventListener("open", () => {
  // if you're here, it means connection has been successfully upgraded from http to websockets
  console.log("connected");
  presence.innerText = "🟢";
});

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  allChat = data.msg;
  render();
});

function render() {
  const html = allChat.map(({ user, text }) => template(user, text));
  msgs.innerHTML = html.join("\n");
}

const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

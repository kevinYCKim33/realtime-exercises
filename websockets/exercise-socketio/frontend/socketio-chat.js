const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const presence = document.getElementById("presence-indicator");
let allChat = [];

// socket.io will downgrade itself to polling if websocket ability not available
// for fun; let's just set WebSocket to null;
// window.WebSocket = null;
// hindsight...I don't think this does anything
// always seem to poll initially before upgrading connection
// now the requests in network tab downgrade to polling!
// crazy!!
// http://localhost:8080/socket.io/?EIO=4&transport=polling&t=OwCuLmZ
// a global called "io" is being loaded separately
// from a cdn script tag

// #1. Hey I want to upgrade this to a Websocket connection
const socket = io("http://localhost:8080"); // io we get globally

// out of the box, retry/backoff logic already done for you
socket.on("connect", () => {
  console.log("connected"); // yup, BE has websockets, and now so do you!
  presence.innerText = "🟢";
});

socket.on("disconnect", () => {
  presence.innerText = "🔴";
});

// must be consistently named msg:get with BE; but can be named everything;
// just in sync
socket.on("msg:get", (data) => {
  allChat = data.msg;
  render();
});

// code ends here

chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  // new code
  const data = { user, text };

  // .emit and .on go both ways from FE to BE and BE to FE
  // .emit: send to other end this
  // .on: when other end sends something through this, get the data and do whatever cb to it
  socket.emit("msg:post", data);
}

function render() {
  const html = allChat.map(({ user, text }) => template(user, text));
  msgs.innerHTML = html.join("\n");
}

const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

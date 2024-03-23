const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

// let's store all current messages here
let allChat = [];

// the interval to poll at in milliseconds
const INTERVAL = 3000;

// a submit listener on the form in the HTML
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  // post to /poll a new message
  // write code here
  const data = {
    user,
    text,
  };

  const options = {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };

  await fetch("/poll", options);
}

// WORST WAY: use setInterval
// why worst? what if your interval is 3 seconds,
// but your BE takes 4 seconds to respond?
// stale and inconsistent data state mess will be better;

// OKAY WAY: use setTimeout to call the async await polling function recursively
// only after updating the ui with the latest be, then you call the recursive function
async function getNewMsgs() {
  // poll the server
  // write code here
  // const res = await fetch('/asdf.com')
  // const derp = await res.json();
  // const msg = derp.msgs;
  let json;
  try {
    const res = await fetch("/poll");
    json = await res.json();
  } catch (e) {
    // backoff code
    console.error("polling error", e);
  }

  allChat = json.msg;
  render();
  setTimeout(getNewMsgs, INTERVAL);
}

function render() {
  // as long as allChat is holding all current messages, this will render them
  // into the ui. yes, it's inefficent. yes, it's fine for this example
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

// given a user and a msg, it returns an HTML string to render to the UI
const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

// make the first request
getNewMsgs();

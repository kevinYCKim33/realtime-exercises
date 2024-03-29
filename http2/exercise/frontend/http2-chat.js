const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const presence = document.getElementById("presence-indicator"); // the red/green dot

// this will hold all the most recent messages
let allChat = [];

chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

// unchanged from polling
async function postNewMsg(user, text) {
  const data = {
    user,
    text,
  };

  // request options
  const options = {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };

  // send POST request
  // we're not sending any json back, but we could
  await fetch("/msgs", options);
}

async function getNewMsgs() {
  console.log("trigger getNewMsgs");
  let reader;
  const utf8Decoder = new TextDecoder("utf-8");
  try {
    console.log("about to fetch /msgs");
    const res = await fetch("/msgs");
    // can't use res.json here
    // since by design, our reader will never finish
    // our reader is a STREAM!
    reader = res.body.getReader(); // turns to readable text stream
  } catch (e) {
    console.log("connection error", e);
  }
  // presence.innerText = "🟢";
  presence.innerText = "huh";

  let readerResponse;
  let done;
  do {
    try {
      console.log("do try go forever?");
      // stuck here forever until there's another
      // stream.write call from backend
      // the initial GET calls a stream.write
      // subsequest POSTs call stream.write
      readerResponse = await reader.read();
      console.log("readerResponse is: ", readerResponse);
    } catch (e) {
      console.error("reader fail", e);
      presence.innerText = "🔴";
      return;
    }
    console.log("do i hit here repeatedely?");
    const chunk = utf8Decoder.decode(readerResponse.value, { stream: true });
    done = readerResponse.done;

    if (chunk) {
      try {
        const json = JSON.parse(chunk);
        allChat = json.msg;
        console.log("do i render repeatedely?");
        render();
      } catch (e) {
        console.error("parse error", e);
      }
    }
  } while (!done);
  presence.innerText = "🔴";
}

function render() {
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

getNewMsgs();

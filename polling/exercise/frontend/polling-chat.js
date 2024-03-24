const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

// let's store all current messages here
let allChat = [];

// the interval to poll at in milliseconds
const INTERVAL = 3000;
const BACKOFF_INITIAL = 500;

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

    // lol that's a clean way to handle 400 and 500 errors
    if (res.status >= 400) {
      throw new Error("request did not succeed: ", +res.status);
    }

    allChat = json.msg; // server 500 error would just crash here
    // Cannot read properties of undefined (readming 'msg')
    render();
    failedTries = 0; // reset to 0, cause what if user switches from wifi to LTE, and failedTries gets up to 3
    // then user switches back to wifi and weird error again? don't want next error to amount from previous error counter
    // setTimeout(getNewMsgs, INTERVAL);
    BACKOFF = BACKOFF_INITIAL;
  } catch (e) {
    // backoff code
    console.error("polling error", e);
    failedTries++; // global variable
    BACKOFF = BACKOFF * 2; // make exponential
  }
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

// const BACKOFF = 5000;
let BACKOFF = BACKOFF_INITIAL;
// make the first request
let timeToMakeNextRequest = 0;
let failedTries = 0;
async function rafTimer(time) {
  // time: represents the last time the frame finished rendering
  // AKA: this will fire a ton!!!
  // console.log("time is: ", time);
  if (timeToMakeNextRequest <= time) {
    console.log("timeToMakeNextRequest: ", timeToMakeNextRequest);
    await getNewMsgs();
    // what if user switches wifi? app just crashes?
    // what if LTE has a bit of blip?
    // OBAMA AMA's crashed reddit
    // Just retrying everything is also bad
    // try 3s; 6s; 12s; 24s; 48s;
    // ^ exponential backoff is the answer
    // linear seconds: 10s, 20s, 30s, ...
    console.log("i never make it here in a 500 error");
    // TIL: 2 ** 3 === 8 === Math.pow(2, 3)
    // 5s, 10s, 15s, 20s, << current
    // timeToMakeNextRequest = time + INTERVAL + failedTries * BACKOFF;
    // 5s, 10s, 20s, 40s, << want
    console.log("BACKOFF IS: ", BACKOFF);
    timeToMakeNextRequest = time + INTERVAL + (failedTries ? BACKOFF : 0);
    // ^ way to make exponential; BACKOFF now needs to be a let
    // general rule of thumb: immediately try again,
    // try twice more in short intervals
    // failed 3 times? backoff aggressively to not overload server
    // axios has built in retry and backoff
    // https://github.com/softonic/axios-retry
    // so many dense knowledge in 15m of FEM
    // (1) 2 ** 3 = 8
    // (2) exponential backoff
    // (3) simulate 500's in express
    // (4) exponential retry logic
    // (5) axios-retry library existence
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
   * requestAnimationFrame(callback)
      callback:
        The function to call when it's time to update your animation for the next repaint. 
        This callback function is passed a single argument: a DOMHighResTimeStamp 
        indicating the end time of the previous frame's rendering 
        (based on the number of milliseconds since time origin).
        The timestamp is a decimal number, in milliseconds, but with a 
        minimal precision of 1 millisecond. 
   * 
   */
  requestAnimationFrame(rafTimer);
}
// getNewMsgs();

// why this is better
// this function won't run when user is not staring at this tab in the browser
// saves your BE from receiving tons of data
// saves FE from consuming battery life
requestAnimationFrame(rafTimer);

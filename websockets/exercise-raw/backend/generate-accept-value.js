import crypto from "crypto";

function generateAcceptValue(acceptKey) {
  return (
    crypto
      .createHash("sha1")
      // this magic string key is actually in the spec
      .update(acceptKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", "binary") // must be these exact keys for it to be WebSockets
      // why these exact string??
      .digest("base64")
  );
}

export default generateAcceptValue;

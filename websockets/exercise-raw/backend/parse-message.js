// https://btholt.github.io/complete-intro-to-realtime/websockets-backend
/*
      0                   1                   2                   3
      0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
     +-+-+-+-+-------+-+-------------+-------------------------------+
     |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
     |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
     |N|V|V|V|       |S|             |   (if payload len==126/127)   |
     | |1|2|3|       |K|             |                               |
     +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
     |     Extended payload length continued, if payload len == 127  |
     + - - - - - - - - - - - - - - - +-------------------------------+
     |                               |Masking-key, if MASK set to 1  |
     +-------------------------------+-------------------------------+
     | Masking-key (continued)       |          Payload Data         |
     +-------------------------------- - - - - - - - - - - - - - - - +
     :                     Payload Data continued ...                :
     + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
     |                     Payload Data continued ...                |
     +---------------------------------------------------------------+

     1 and 8 are the only ones we care about...
*/

// TLDR: user sends a message through websocket
// message gets sent as simple json
// however gets encoded in some sort of weird format like this
//  // <Buffer 81 a1 15 8b 8b ee 6e a9 fe 9d 70 f9 a9 d4 37 ea f8 8a 73 a9 a7 cc 61 ee f3 9a 37 b1 a9 9f 62 ee fa 99 70 fc fa cc 68>
// this parseMessage essentially decodes this back into plain JavaScript
function parseMessage(buffer) {
  const firstByte = buffer.readUInt8(0);
  const opCode = firstByte & 0xf; // bitwise operator??

  if (opCode === 8) {
    // connection closed
    return null;
  }
  if (opCode !== 1) {
    // we only care about text frames
    return;
  }

  // text code is 1
  const secondByte = buffer.readUInt8(1);
  const isMasked = secondByte >>> 7 === 1;
  // we should only be seeing masked frames from the browser
  if (!isMasked) {
    throw new Error("we only care about masked frames from the browser");
  }

  const maskingKey = buffer.readUInt32BE(2);
  let currentOffset = 6;

  const messageLength = secondByte & 0x7f;
  if (messageLength > 125) {
    throw new Error("lol we're not doing big frames");
  }

  // getting all of the bytes together for the string
  // then we'll convert it to a utf8 string
  const response = Buffer.alloc(messageLength);
  for (let i = 0; i < messageLength; i++) {
    // applying the mask to get the correct byte out
    const maskPosition = i % 4;

    let shift;
    if (maskPosition === 3) {
      shift = 0;
    } else {
      shift = (3 - maskPosition) << 3;
    }

    let mask;
    if (shift === 0) {
      mask = maskingKey & 0xff;
    } else {
      mask = (maskingKey >>> shift) & 0xff;
    }

    const source = buffer.readUInt8(currentOffset);
    currentOffset++;
    response.writeUInt8(mask ^ source, i);
  }

  return JSON.parse(response.toString("utf8"));
}

export default parseMessage;

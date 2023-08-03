import {BSON} from "mongodb";
import {webByteUtils} from "./modules/buffer";

export const OP_MSG = 2013;

export function constructMessage(requestId, response,op_code = 2013) {
  const responseBytes = BSON.serialize(response);
  const payloadTypeBuffer = new Uint8Array([0]);
  const headers = new DataView(new ArrayBuffer(20))
  headers.setInt32(4, 0, true);
  headers.setInt32(8, requestId, true);
  headers.setInt32(12, op_code, true);
  headers.setInt32(16, 0, true);
  const bufferResponse = webByteUtils.concat([new Uint8Array(headers.buffer), payloadTypeBuffer, responseBytes]);
  const dv = new DataView(bufferResponse.buffer, bufferResponse.byteOffset, bufferResponse.byteLength);
  dv.setInt32(0, bufferResponse.byteLength, true);
  console.log("header added, returning message");
  return new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
}

export
function parseMessage(message: Uint8Array) {
  const dv = new DataView(message.buffer, message.byteOffset, message.byteLength);
  const messageHeader = {
    length: dv.getInt32(0, true),
    requestId: dv.getInt32(4, true),
    responseTo: dv.getInt32(8, true),
    opCode: dv.getInt32(12, true),
    flags: dv.getInt32(16, true)
  };
  console.log("hi")
  if (messageHeader.opCode !== OP_MSG) {
    console.log("is op");
    const nsNullTerm = message.indexOf(0x00, 20);
    // console.log("null term");
    const ns = webByteUtils.toUTF8(message.subarray(20, nsNullTerm));
    // console.log("ebByteUtils.toUTF8");
    const nsLen = nsNullTerm - 20 + 1;
    const numberToSkip = dv.getInt32(20 + nsLen, true);
    const numberToReturn = dv.getInt32(20 + nsLen + 4, true);
    const docStart = 20 + nsLen + 4 + 4;
    const docLen = dv.getInt32(docStart, true);
    // console.log("bson deserialize");
    // console.log("messageHeader",messageHeader);
    // console.log("doc start and length:",docStart, docLen);
    try {
      const doc = BSON.deserialize(message.subarray(docStart, docStart + docLen));
      // console.log("no err?");
      return {
        ...messageHeader,
        ns,
        numberToSkip,
        numberToReturn,
        doc
      };
    } catch (e) {
      console.log(e.message);
    }
  } else {
    console.log("is not op");
    const payloadType = dv.getUint8(20);
    const docStart = 20 + 1;
    const docLen = dv.getUint32(docStart, true);
    const doc = BSON.deserialize(message.subarray(docStart, docStart + docLen));
    return {
      ...messageHeader,
      payloadType,
      doc
    };
  }
}
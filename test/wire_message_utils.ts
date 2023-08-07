import { BSON } from "mongodb";
import { webByteUtils } from "../src/modules/web_byte_utils";

export const OP_MSG = 2013;

export function constructMessage(requestId, response,op_code = OP_MSG) {
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
  return new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
}

export function parseMessage(message: Uint8Array) {
  const dv = new DataView(message.buffer, message.byteOffset, message.byteLength);
  const messageHeader = {
    length: dv.getInt32(0, true),
    requestId: dv.getInt32(4, true),
    responseTo: dv.getInt32(8, true),
    opCode: dv.getInt32(12, true),
    flags: dv.getInt32(16, true)
  };
  if (messageHeader.opCode !== OP_MSG) {
    const nsNullTerm = message.indexOf(0x00, 20);
    const ns = webByteUtils.toUTF8(message.subarray(20, nsNullTerm));
    const nsLen = nsNullTerm - 20 + 1;
    const numberToSkip = dv.getInt32(20 + nsLen, true);
    const numberToReturn = dv.getInt32(20 + nsLen + 4, true);
    const docStart = 20 + nsLen + 4 + 4;
    const docLen = dv.getInt32(docStart, true);
    const doc = BSON.deserialize(message.subarray(docStart, docStart + docLen));
    return {
      ...messageHeader,
      ns,
      numberToSkip,
      numberToReturn,
      doc
    };
  } else {
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
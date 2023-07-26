import { BSON } from "mongodb";
import { webByteUtils} from "./modules/buffer";

export const OP_MSG = 2013;

export const myHello = () => ({
  helloOk: true,
  isWritablePrimary: true,
  // topologyVersion: { processId: new BSON.ObjectId(), counter: 0 },
  maxBsonObjectSize: 16777216,
  maxMessageSizeBytes: 48000000,
  maxWriteBatchSize: 100000,
  localTime: new Date(),
  logicalSessionTimeoutMinutes: null,
  connectionId: 85,
  minWireVersion: 0,
  maxWireVersion: 17,
  readOnly: false,
  ok: 1,
});

export enum WebsocketEvents {
  open = 'open',          // Connection is opened or re-opened
  close = 'close',        // Connection is closed
  error = 'error',        // An error occurred
  message = 'message',    // A message was received
  retry = 'retry'         // A try to re-connect is made
}

export function constructMessage(requestId, response) {
  const responseBytes = BSON.serialize(response);
  const payloadTypeBuffer = new Uint8Array([0]);
  const headers = new DataView(new ArrayBuffer(20))
  headers.setInt32(4, 0, true);
  headers.setInt32(8, requestId, true);
  headers.setInt32(12, OP_MSG, true);
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

export class LaurelsSocket {
  binaryType: string;
  private readonly url: string;
  private readonly protocols?: string | string[];
  private readonly buffer?: any;
  private readonly backoff?: any;
  private readonly eventListeners: Record<string, Array<(message: any) => void>>;
  private closedByUser: boolean = false;
  private retries: number = 0;

  constructor(url: string) {
    this.url = url;
    this.eventListeners = {};
  }

  close() {
    console.log("closing LaurelsSocket");
  }

  send(buffer: any) {
    console.log("sending message through LaurelsSocket");
    //add hello message to async iterator here
    const message = parseMessage(buffer);
    // console.log("message:",message);
    if (message.doc.hello || message.doc.ismaster) {
      console.log("message is hello"); //returning hello message
      const hello = constructMessage(message.requestId, myHello());
      // do sending
      this.eventListeners["message"][0]({data: hello});
    } else {
      console.log("message is not hello"); //returning default for ping
      this.eventListeners["message"][0]
      ({data: constructMessage(message.requestId, {ok:1 }) });
    }
  }

  public addEventListener(type: "open" | "close" | "error" | "message", listener: any, options?: any): void {
    let tmp: Array<any> = new Array<any>();
    let eventList = this.eventListeners[type]? this.eventListeners[type]: tmp;
    eventList.push(listener);
    this.eventListeners[type] = eventList;
  }
}
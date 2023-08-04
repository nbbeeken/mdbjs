import { constructMessage, parseMessage } from "./message_processing";

export const myHello = () => ({
  helloOk: true,
  isWritablePrimary: true,
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

export class TestSocketInstance {
  binaryType: string;
  private readonly url: string;
  private readonly eventListeners: Record<string, (message: any) => void>;

  constructor(url: string) {
    this.url = url;
    this.eventListeners = {};
  }

  close() {
    console.log("closing TestSocketInstance");
  }

  send(buffer: any) {
    const message = parseMessage(buffer);
    if (message.doc.hello || message.doc.ismaster) {
      const hello = constructMessage(message.requestId, myHello());
      this.eventListeners["message"]({data: hello}); //hello message
    } else {
      this.eventListeners["message"]
      ({data: constructMessage(message.requestId, {ok:1 }) }); //returning default for ping
    }
  }

  public addEventListener(type: "open" | "close" | "error" | "message", listener: any, options?: any): void {
    this.eventListeners[type] = listener;
  }
}
import { constructMessage, parseMessage } from "./message_processing";

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

export class laurels_socket {
  binaryType: string;
  private readonly url: string;
  private readonly protocols?: string | string[];
  private readonly buffer?: any;
  private readonly backoff?: any;
  private readonly eventListeners: Record<string, Array<(message: any) => void>>;
  private closedByUser: boolean = false;
  private retries: number = 0;
  activated: boolean;

  constructor(url: string) {
    this.url = url;
    this.eventListeners = {};
    this.activated = false;
  }

  close() {
    console.log("closing laurels_socket");
  }

  send(buffer: any) {
    console.log("sending message through laurels socket");
    //add hello message to async iterator here
    const message = parseMessage(buffer);
    console.log("message:",message);
    // if (!this.activated) {
    //   console.log("activating socket");
    //   this.eventListeners["message"][0]({data: constructMessage(message.requestId, {ok:1 })});
    // }
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
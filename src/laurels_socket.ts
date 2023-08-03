import { constructMessage, parseMessage } from "./message_processing";

export const myHello = () => ({
  helloOk: true,
  isWritablePrimary: true,
  // topologyVersion: { processId: new BSON.ObjectId(), counter: 0 }, //bson bug - not necessary for hello
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

export class laurels_socket {
  binaryType: string;
  private readonly url: string;
  private readonly protocols?: string | string[];
  private readonly buffer?: any;
  private readonly backoff?: any;
  private readonly eventListeners: Record<string, Array<(message: any) => void>>;
  private closedByUser: boolean = false;
  private retries: number = 0;
  private activated: boolean; //for prehello message

  constructor(url: string) {
    this.url = url;
    this.eventListeners = {};
    this.activated = false; //for prehello message
  }

  close() {
    console.log("closing laurels_socket");
  }

  send(buffer: any) {
    const message = parseMessage(buffer);
    // for prehello message
    // if (!this.activated) {
    //   console.log("activating socket");
    //   this.eventListeners["message"][0]({data: constructMessage(message.requestId, {ok:1 })});
    // }
    if (message.doc.hello || message.doc.ismaster) {
      const hello = constructMessage(message.requestId, myHello());
      this.eventListeners["message"][0]({data: hello}); //hello message
    } else {
      this.eventListeners["message"][0]
      ({data: constructMessage(message.requestId, {ok:1 }) }); //returning default for ping
    }
  }

  public addEventListener(type: "open" | "close" | "error" | "message", listener: any, options?: any): void {
    let tmp: Array<any> = new Array<any>();
    let eventList = this.eventListeners[type]? this.eventListeners[type]: tmp;
    eventList.push(listener);
    this.eventListeners[type] = eventList;
  }
}
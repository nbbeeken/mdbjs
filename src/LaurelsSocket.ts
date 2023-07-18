
export enum WebsocketEvents {
  open = 'open',          // Connection is opened or re-opened
  close = 'close',        // Connection is closed
  error = 'error',        // An error occurred
  message = 'message',    // A message was received
  retry = 'retry'         // A try to re-connect is made
}


export class LaurelsSocket {
  binaryType: string;
  private readonly url: string;
  private readonly protocols?: string | string[];
  private readonly buffer?: any;
  private readonly backoff?: any;
  private readonly eventListeners: any;
  private closedByUser: boolean = false;
  private retries: number = 0;

  constructor() {

  }

  close() {
    console.log("closing LaurelsSocket");
  }

  send(buffer: any) {
    console.log("sending message through LaurelsSocket");
  }

  public addEventListener<K extends WebsocketEvents>(
      type: K,
      listener: () => any,
      options?: boolean | AddEventListenerOptions): void {
  }
}
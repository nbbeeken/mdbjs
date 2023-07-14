export class LaurelsSocket {
  binaryType: string;
  constructor() {

  }

  close() {
    console.log("closing LaurelsSocket");
  }

  send(buffer: any) {
    console.log("sending message through LaurelsSocket");
  }

  // addEventListener(eventType: string, event: () => void) {
  //   console.log("adding event listener:",eventType);
  // }
}
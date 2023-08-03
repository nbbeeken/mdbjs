import { webByteUtils} from "./buffer";
import { Buffer } from "buffer";
import { Duplex } from "stream";
import { SocketWrapper } from '../ws';
import { constructMessage, parseMessage } from "../message_processing";

const streams = new Map<number,SocketInstance>;
//<k,v> -> <SocketInstance.streamIdentifier,SocketInstance>
export default streams;

export class SocketInstance extends Duplex {
    options: { port: number; host: string };
    isKeptAlive: boolean;
    keepAliveDelay: number;
    timeoutMS: number;
    noDelay: boolean;
    ws: SocketWrapper;
    wsReader: AsyncGenerator<Uint8Array, any, unknown>;
    forwarder: Promise<void>;
    remoteAddress: string;
    remotePort: number;
    streamIdentifier: number;
    isReady: boolean;
    isActivated: boolean;
    whenReady: Promise<boolean>;
    timeInterval: number = 1000;
    timeRange: number = 10000;

    constructor(options: { port: number; host: string; streamIdentifier: number }) {
        console.log("creating SocketInstance");
        super();
        this.options = options;
        this.remoteAddress = options.host;
        this.remotePort = options.port;
        this.ws = new SocketWrapper();
        this.wsReader = this.ws[Symbol.asyncIterator]();
        // this.forwarder = this.forwardMessagesToDriver();
        this.streamIdentifier = options.streamIdentifier;
        this.isActivated = false;
        this.whenReady = new Promise((resolve, reject) => {
            resolve(true);
        });
        console.log("finished creating SocketInstance");
    }

    _write(chunk, encoding, callback) {
        // this.ws.send(new Buffer(chunk));
        this.ws.send(chunk);
        callback();
    }

    _read(size) {
        (async () => {
            for await (const message of this.wsReader) {
                this.push(new Buffer(message))
            }
        })()
    }

    // TCP specific
    setKeepAlive(enable: boolean, initialDelayMS: number) {
        this.isKeptAlive = enable;
        this.keepAliveDelay = initialDelayMS;
    }

    setTimeout(timeoutMS: number) {
        this.timeoutMS = timeoutMS;
    }

    setNoDelay(noDelay: boolean) {
        this.noDelay = noDelay;
    }

    override once(eventName: any, listener: any): this {
        super.once(eventName, listener);
        if (eventName === 'connect') {
            setTimeout(() => {
                listener('connect');
            }, 1)
        }
        return this;
    }

    preHelloInfo() {
        return {
            port: this.options.port,
            host: this.options.host,
            ok: 1
        }
    }

    // override push(outgoingDataBuffer: Uint8Array) {
    //     // throw new Error("hi err");
    //     console.log("pushing message using override");
    //     // const outgoing = parseMessage(outgoingDataBuffer);
    //     // console.log("state of ws is ready ",this.isReady);
    //     // if (!this.isActivated) { //check that promise hasn't been resolved yet
    //     //     //send host message
    //     //     console.log('starting prehello stuff');
    //     //     let preHelloMessage = constructMessage(1,this.preHelloInfo());
    //     //     console.log("message constructed");
    //     //     let check = parseMessage(preHelloMessage).opCode;
    //     //     console.log("checking op code:", check);
    //     //     // throw new Error("idk");
    //     //     console.log('prehello message prepped');
    //     //     this.ws.send(preHelloMessage);
    //     //     console.log("sent message, waiting for response");
    //     //     // setTimeout(() => {
    //     //     //     let socketStatus = this.checkSocketStatus();
    //     //     //     console.log("state of ws is ready in push (function)",socketStatus);
    //     //     // // this.processPreHelloWrapper();
    //     //     // // console.log("after processing");
    //     //     // //     this.processPreHelloBetter(this.processPreHello(),100);
    //     //     // }, 100);
    //     //     // this.isReady = true; //dont need can be set in forwardmessagestodriver
    //     //     //await for host to return message before sending actual hello
    //     //     // const v = await this.isReadyYet();
    //     //     // console.log(v);
    //     //     let socketStatus = this.checkSocketStatusWrapper(this.delay(),this.checkSocketStatus(this.getSocketStatus()),this.getSocketStatus(),this.timeRange);
    //     //
    //     //     // .then(
    //     //     //     function(result) {
    //     //     //         console.log("success", result);
    //     //     //     },
    //     //     //     error => console.log("error", error.getMessage())
    //     //     // );
    //     //     //await or .then
    //     //     //
    //     //     console.log("state of ws is ready in push (promise)", socketStatus);
    //     //     console.log("state of ws is ready in push (flag in if)", this.isReady);
    //     // }
    //     // console.log("state of ws is ready in push (flag)",this.isReady);
    //     this.ws.send(outgoingDataBuffer);
    // }

    async checkSocketStatusWrapper(delay, checkSocketStatus, socketStatus,timeRange) {
        let start = new Date().getTime();
        let current = start;
        let counter = 0;
        console.log("status:",socketStatus, "start:", start, "current:", current);
        let d = delay.resolve();
        while (!socketStatus && (current - start) < timeRange) {
            if (socketStatus) {
                return true;
            }
            let d = delay.resolve();
            // let result = await delay();
            counter += d;
            current = new Date().getTime();
            console.log("status:",socketStatus, "start:", start, "current:", current);
        }
        return false;
    }

    async checkSocketStatus(socketStatus) {
        return new Promise(function(resolve, reject) {
            if (socketStatus) {
                resolve(socketStatus);
            } else {
                reject();
            }
        })
    }

    getSocketStatus() {
        return this.isReady;
    }

    async delay() {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(this.timeInterval), this.timeInterval);
        });
    }

    processPreHelloWrapper() {
        return new Promise((resolve) => {
            setTimeout(() => resolve(this.processPreHello()), 1000);
        })
    }

    async processPreHello() {
        console.log("processing prehello message");
        for await (const message of this.wsReader) {
            console.log("sending message to driver " + message);
            const incoming = parseMessage(message);
            console.log("parsing incoming message in processPreHello");
            if (incoming.doc.ok === 1) {
                this.isReady = true;
            }
            console.log("state of ws is ready ",this.isReady);
            break;
        }
    }

    async forwardMessagesToDriver() {
        console.log("forwarding messages to driver");
        for await (const message of this.wsReader) {


            // const incoming = parseMessage(message);
            // console.log("sending message to driver ", incoming);
            // if (!this.isActivated) {
            //     if (incoming.doc.ok === 1) {
            //         // this.isReady = true; //whenready.resolve()
            //         this.whenReady.resolve();
            //     }
            //     console.log("state of ws is ready forwardmessagestodriver",this.isReady);
            // } else {
            //     console.log("message:",incoming);
            //     this.stream.write(new Buffer(message), null, () => null)
            // }
            this._write(message, null, () => null);
        }
    }
}

export function createConnection(options) {
    // throw new Error('is create connection working');
    //console.log('createconnection called');
    const socket = new SocketInstance(options);
    return socket;
}

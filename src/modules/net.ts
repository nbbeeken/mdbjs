import { BSON } from "mongodb";
import { webByteUtils, Buffer } from "./buffer";
import { Duplex } from "./stream";
import { SingularSocket, MessageRelay } from '../ws';

export const OP_MSG = 2013;

const streams = new Map<number,SocketInstance>;
//<k,v> -> <SocketInstance.streamIdentifier,SocketInstance>
export default streams;

export class SocketInstance extends Duplex {
    options: { port: number; host: string };
    isKeptAlive: boolean;
    keepAliveDelay: number;
    timeoutMS: number;
    noDelay: boolean;
    /** We make one websocket for every socket in the driver. Now we do not need multiplexing */
    ws: MessageRelay;
    wsReader: AsyncGenerator<Uint8Array, any, unknown>;
    forwarder: Promise<void>;
    remoteAddress: string;
    remotePort: number;
    streamIdentifier: number;

    constructor(options: { port: number; host: string; streamIdentifier: number }) {
        console.log("creating SocketInstance");
        super();
        this.options = options;
        this.remoteAddress = options.host;
        this.remotePort = options.port;
        this.ws = new MessageRelay();
        this.wsReader = this.ws[Symbol.asyncIterator]();
        this.forwarder = this.forwardMessagesToDriver();
        this.streamIdentifier = options.streamIdentifier;
        console.log("finished creating SocketInstance");
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

    getMessageRelay() {
        return this.ws;
    }

    // MessageStream requirement
    pipe<T extends NodeJS.WritableStream = any>(stream: T): void {
        console.info(`pipe(${stream})`);
        this.stream = stream;
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

    // MessageStream internally calls write as Msgs are pushed to it
    write(chunk: any): void {
        console.info('write');
    }
    // Two different shutdown APIs
    end(callback: () => void) {
        this.destroy();
        setTimeout(callback, 1)
    }

    override push(outgoingDataBuffer: Uint8Array) {
        console.log("pushing message using override");
        // const outgoing = parseMessage(outgoingDataBuffer);
        // if (outgoing.doc.hello || outgoing.doc.ismaster) {
        //     console.log("before sending fake message");
        //     this.ws.sendFakeMessage(outgoing.requestId, this.streamIdentifier, myHello())
        //     console.log("after sending fake message");
        //     return;
        // }
        // console.dir({ send: outgoing });
        // const headedMessage = addStreamIdentifier(outgoingDataBuffer, this.streamIdentifier);
        // this.ws.sendMessageWithHeader(headedMessage);
        console.log("message please");
        this.ws.send(outgoingDataBuffer);
    }

    async forwardMessagesToDriver() {
        console.log("forwarding messages to driver");
        for await (const message of this.wsReader) {
            // const incoming = parseMessage(message)
            // // if (!incoming.doc.isWritablePrimary) {
            // //     console.dir({ recv: incoming });
            // // }
            // console.log("message:",incoming);
            this.stream._write(new Buffer(message), null, () => null)
        }
    }
}

function addStreamIdentifier(message: Uint8Array,streamIdentifier: number) {
    console.log("constructingmessage");
    const responseBytes = BSON.serialize(message);
    const payloadTypeBuffer = new Uint8Array([0]);
    const headers = new DataView(new ArrayBuffer(30));
    headers.setInt32(0,streamIdentifier,true);
    const bufferResponse = webByteUtils.concat([new Uint8Array(headers.buffer), payloadTypeBuffer, responseBytes]);
    const dv = new DataView(bufferResponse.buffer, bufferResponse.byteOffset, bufferResponse.byteLength);
    dv.setInt32(0, bufferResponse.byteLength, true);
    return new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
}

function* incrementalNumberGenerator() {
    let id = 1;
    while (true) {
        yield id++;
    }
}

let generateIdentifier = incrementalNumberGenerator();

export function createConnection(options) {
    //options here represent cluster connection info that will be stored in SingularSocket
    // console.log("createconnection");
    // console.log(SocketOptions);
    // console.log(options);
    
    //will pass in port and host (browser thinks it is where cluster is located)
    //add port and host info to data message
    //will return singular port and host
    const identifier = generateIdentifier.next().value;
    options.identifier = identifier;
    const socket = new SocketInstance(options);
    console.log("createconnection",streams);
    if (identifier) {
        streams.set(identifier,socket);
    }
    return socket;
}

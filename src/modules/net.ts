import { BSON } from "mongodb";
import { webByteUtils, Buffer } from "./buffer";
import { Duplex } from "./stream";
import { SingularSocket, SocketInterface } from '../ws';

export const OP_MSG = 2013;

const myHello = () => ({
    helloOk: true,
    isWritablePrimary: true,
    topologyVersion: { processId: new BSON.ObjectId(), counter: 0 },
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

const streams = new Map<string,SocketInstance>;
//<k,v> -> <SocketInstance.identifier,SocketInstance>
export default streams;

export class SocketInstance extends Duplex {
    options: { port: number; host: string };
    isKeptAlive: boolean;
    keepAliveDelay: number;
    timeoutMS: number;
    noDelay: boolean;
    /** We make one websocket for every socket in the driver. Now we do not need multiplexing */
    ws: SocketInterface;
    wsReader: AsyncGenerator<Uint8Array, any, unknown>;
    forwarder: Promise<void>;
    remoteAddress: string;
    remotePort: number;
    identifier: string;

    constructor(options: { port: number; host: string }) {
        console.log("creating SocketInstance");
        super();
        this.options = options;
        this.remoteAddress = options.host;
        this.remotePort = options.port;
        this.ws = SingularSocket;
        this.wsReader = this.ws[Symbol.asyncIterator]();
        this.forwarder = this.forwardMessagesToDriver();
        this.identifier = generateIdentifier(this.options);
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
        const outgoing = parseMessage(outgoingDataBuffer);
        if (outgoing.doc.hello || outgoing.doc.ismaster) {
            console.log("before sending fake message");
            this.ws.sendFakeMessage(outgoing.requestId, myHello())
            console.log("after sending fake message");
            return;
        }
        console.dir({ send: outgoing });
        this.ws.send(outgoingDataBuffer);
    }

    async forwardMessagesToDriver() {
        console.log("forwarding messages to driver");
        for await (const message of this.wsReader) {
            const incoming = parseMessage(message)
            if (!incoming.doc.isWritablePrimary) {
                console.dir({ recv: incoming });
            }
            this.stream._write(new Buffer(message), null, () => null)
        }
    }
}


function parseMessage(message: Uint8Array) {
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

function generateIdentifier(options: { port: number; host: string }) {
    return String(options.port) + options.host;
}

export function createConnection(options) {
    //options here represent cluster connection info that will be stored in SingularSocket
    // console.log("createconnection");
    // console.log(SocketOptions);
    // console.log(options);
    
    //will pass in port and host (browser thinks it is where cluster is located)
    //add port and host info to data message
    //will return singular port and host
    const identifier = generateIdentifier(options);
    console.log("createconnection",streams);
    if (streams.has(identifier)) {
        return streams.get(identifier);
    } else {
        const socket = new SocketInstance(options);
        streams.set(identifier,socket);
        return socket;
    }
}

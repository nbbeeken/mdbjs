import { BSON } from "mongodb";
import { webByteUtils, Buffer } from "./buffer";
import { Duplex } from "./stream";
import { WebbySocket } from '../ws'

export const OP_MSG = 2013;

const myHello = {
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
};

export class FakeSocket extends Duplex {
    options: { host: string };
    isKeptAlive: boolean;
    keepAliveDelay: number;
    timeoutMS: number;
    noDelay: boolean;
    /** We make one websocket for every socket in the driver. Now we do not need multiplexing */
    ws: WebbySocket;
    wsReader: AsyncGenerator<Uint8Array, any, unknown>;
    forwarder: Promise<void>;
    remoteAddress: string;
    remotePort: number;

    constructor(options: { port: number; host: string }) {
        super();
        this.options = options;
        this.remoteAddress = options.host;
        this.remotePort = options.port;
        this.ws = new WebbySocket(options);
        this.wsReader = this.ws[Symbol.asyncIterator]();
        this.forwarder = this.forwardMessagesToDriver()
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
        const outgoing = parseMessage(outgoingDataBuffer);
        if (outgoing.doc.hello || outgoing.doc.ismaster) {
            this.ws.sendFakeMessage(outgoing.requestId, myHello)
            return;
        }
        console.dir({ send: outgoing });
        this.ws.send(outgoingDataBuffer);
    }

    async forwardMessagesToDriver() {
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

export function createConnection(options) {
    const socket = new FakeSocket(options);
    return socket;
}

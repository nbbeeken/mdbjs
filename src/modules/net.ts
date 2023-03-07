import { BSON } from "mongodb";
import { webByteUtils, Buffer } from "./buffer";
import { Duplex } from "./stream";
import { hooks } from '../index'

export const OP_MSG = 2013;

class FakeSocket extends Duplex {
    options: any;
    isKeptAlive: boolean;
    keepAliveDelay: number;
    timeoutMS: number;
    noDelay: boolean;

    constructor(options) {
        super();
        this.options = options;
    }

    remoteAddress = 'iLoveJavaScript';
    remotePort = 2390;
    // TCP specific
    setKeepAlive(enable: boolean, initialDelayMS: number) {
        console.info(`setKeepAlive(${enable}, ${initialDelayMS})`);
        this.isKeptAlive = enable;
        this.keepAliveDelay = initialDelayMS;
    }

    setTimeout(timeoutMS: number) {
        console.info(`setTimeout(${timeoutMS})`);
        this.timeoutMS = timeoutMS;
    }

    setNoDelay(noDelay: boolean) {
        console.info(`setNoDelay(${noDelay})`);
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

    override push(outgoingDataBuffer) {
        hooks.fromDriver(outgoingDataBuffer, parseMessage(outgoingDataBuffer));
    }

    sendMessageToDriver(requestId, message) {
        const bufferResponse = constructMessage(requestId, message)
        setTimeout(() => {
            this.stream._write(new Buffer(bufferResponse), null, () => null)
        }, 1);
    }

    sendUint8ArrayToDriver(buffer) {
        setTimeout(() => {
            this.stream._write(new Buffer(buffer), null, () => null)
        }, 1);
    }
}

function constructMessage(requestId, response) {
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

export let socket: FakeSocket | null = null;

export function createConnection(options) {
    if (socket == null) {
        socket = new FakeSocket(options);
    }
    return socket;
}

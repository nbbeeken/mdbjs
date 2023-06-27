import { BSON } from "mongodb";
import { webByteUtils } from "./modules/buffer";

function makeNotifier<T>(): { p: Promise<T>, resolve: (value: T) => void; reject: (reason?: Error) => void } {
    /** @type {() => void} */
    let resolve
    /** @type {(error: Error) => void} */
    let reject
    /** @type {Promise<void>} */
    const p = new Promise((pRes, pRej) => {
        resolve = pRes;
        reject = pRej
    })
    // @ts-ignore
    return { p, resolve, reject }
}

export class WebbySocket {
    socket: WebSocket;
    messages: Array<Uint8Array> = [];
    notify: ReturnType<typeof makeNotifier<void>>;

    constructor({ host = 'localhost', port = 9080 } = {}) {
        // this.socket = new WebSocket(`ws://${host}:${port}/ws`);
        console.log("creating webbysocket");
        this.socket = new WebSocket(`ws://localhost:9080/ws`);
        this.socket.addEventListener('close', () => this.#onClose());
        this.socket.addEventListener('error', () => this.#onError());
        this.socket.addEventListener('message', message => this.#onMessage(message));
        this.socket.addEventListener('open', () => this.#onOpen());
        this.socket.binaryType = 'arraybuffer';
        this.notify = makeNotifier<void>();
    }

    #onClose() {
        console.log('WebbySocket: #onClose()');
    }
    #onError() {
        console.log('WebbySocket: #onError()');
    }
    #onMessage(message: { data: ArrayBuffer }) {
        console.log('WebbySocket: #onMessage()');
        this.messages.push(new Uint8Array(message.data))
        this.notify.resolve();
    }
    #onOpen() {
        console.log('WebbySocket: #onOpen()');
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<Uint8Array> {
        await this.notify.p;
        this.notify = makeNotifier();
        while (this.messages.length) {
            const value = this.messages.shift();
            if (value) {
                yield value
            }
            await this.notify.p;
            this.notify = makeNotifier();
        }
        throw new Error('socket had no messages after notify.resolve() was called')
    }

    sendFakeMessage(reqId: number, data: Record<string, any>) {
        setTimeout(() => {
            this.#onMessage({ data: constructMessage(reqId, data).buffer });
        }, 1);
    }

    send(buffer: Uint8Array) {
        this.socket.send(buffer);
    }
}

export const OP_MSG = 2013;
function constructMessage(requestId, response) {
    console.log("constructingmessage");
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

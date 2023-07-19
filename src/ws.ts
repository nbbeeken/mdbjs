import { BSON } from "mongodb";
import { webByteUtils } from "./modules/buffer";
import { LaurelsSocket } from "./LaurelsSocket";

const WebSocket = isBrowser() ? globalThis.WebSocket : LaurelsSocket;

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

function isBrowser() {
    // Check if the environment is Node.js
    if (typeof process === "object" && process.title === 'node'){
        console.log("environment is Node.js -> not browser");
        return false;
    }
    // Check if the environment is a Service worker
    if (typeof importScripts === "function") {
        console.log('env is service worker -> not browser');
        return false;
    }
    // Check if the environment is a Browser
    if ((typeof window === "object")) {
        console.log("environment is browser");
        return true;
    }
}

export class MessageRelay {
    socket: WebSocket | LaurelsSocket;
    messages: Array<Uint8Array> = [];
    notify: ReturnType<typeof makeNotifier<void>>;
    url: string;

    constructor({ host = 'localhost', port = 9080 } = {}) {
        this.url = `ws://${host}:${port}/ws`;
        // if (isBrowser()) {
        //     console.log("browser form!");
            this.socket = new WebSocket(this.url);
            this.socket.addEventListener('close', () => this.#onClose());
            this.socket.addEventListener('error', () => this.#onError());
            this.socket.addEventListener('message', message => this.#onMessage(message));
            this.socket.addEventListener('open', () => this.#onOpen());
        // } else {
        //     console.log("testing form");
        //     this.socket = new LaurelsSocket();
        // }
        this.socket.binaryType = 'arraybuffer';
        this.notify = makeNotifier<void>();
        console.log("finished MessageRelay");
    }

    #onClose() {
        console.log('MessageRelay: #onClose()');
    }
    #onError() {
        console.log('MessageRelay: #onError()');
    }
    #onMessage(message: { data: ArrayBuffer }) {
        console.log('MessageRelay: #onMessage()');
        this.messages.push(new Uint8Array(message.data))
        this.notify.resolve();
    }
    #onOpen() {
        console.log('MessageRelay: #onOpen()');
    }

    //listener
    async *[Symbol.asyncIterator](): AsyncGenerator<Uint8Array> {
        console.log("listening iterator");
        await this.notify.p;
        this.notify = makeNotifier();
        while (this.messages.length) {
            const value = this.messages.shift();
            if (value) {
                console.log("listening iterator value:",value);
                yield value
            }
            await this.notify.p;
            this.notify = makeNotifier();
        }
        throw new Error('socket had no messages after notify.resolve() was called')
    }

    send(buffer: Uint8Array) {
        //parameter which contains info about socket
        //where multiplexing happens
        // addbuffer();
        //bson has uuid class
        //or have a counter that starts at 1
        //every single message that system sends will have unique identifier
        console.log("sending message using send function");
        this.socket.send(buffer);
    }

    sendMessageWithHeader(buffer) {
        console.log("sending message with header");
        this.socket.send(buffer);
    }
}

const SocketOptions = { port: 9080, host: '127.0.0.1' }; //web socket connection
export const SingularSocket = new MessageRelay(SocketOptions);
// export default SingularSocket;
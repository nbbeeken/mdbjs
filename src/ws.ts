import { laurels_socket } from "./laurels_socket";
import {parseMessage} from "./message_processing";

const WebSocket = isBrowser() ? globalThis.WebSocket : laurels_socket;

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
    if ((typeof process === "object" && process.title === 'node') || (typeof importScripts === "function")) {
        return false;
    }
    if ((typeof window === "object")) {
        return true;
    }
}

export class SocketWrapper {
    socketMode: string;
    socket: WebSocket | laurels_socket;
    messages: Array<Uint8Array> = [];
    notify: ReturnType<typeof makeNotifier<void>>;
    url: string;
    readyState: boolean;

    constructor({ host = 'localhost', port = 9080 } = {}) {
        this.url = `ws://${host}:${port}/ws`;
        this.socket = new WebSocket(this.url);
        this.socket.addEventListener('close', () => this.#onClose());
        this.socket.addEventListener('error', () => this.#onError());
        this.socket.addEventListener('message', message => this.#onMessage(message));
        this.socket.addEventListener('open', () => this.#onOpen());
        this.socketMode = isBrowser()? "browser" : "test";
        console.log(this.socketMode);
        this.socket.binaryType = 'arraybuffer';
        this.notify = makeNotifier<void>();
        console.log("finished SocketWrapper");
        this.readyState=false;
    }

    #onClose() {
        console.log('SocketWrapper: #onClose()');
    }
    #onError() {
        console.log('SocketWrapper: #onError()');
    }
    #onMessage(message: { data: ArrayBuffer }) {
        console.log('SocketWrapper: #onMessage()');
        this.messages.push(new Uint8Array(message.data))
        this.notify.resolve();
    }
    #onOpen() {
        console.log('SocketWrapper: #onOpen()');
        this.readyState=true;
    }

    //listener
    async *[Symbol.asyncIterator](): AsyncGenerator<Uint8Array> {
        console.log("listening iterator");
        await this.notify.p;
        this.notify = makeNotifier();
        while (this.messages.length) {
            const value = this.messages.shift();
            if (value) {
                console.log("listening iterator value:",parseMessage(value));
                yield value
            }
            await this.notify.p;
            this.notify = makeNotifier();
        }
        throw new Error('socket had no messages after notify.resolve() was called')
    }

    send(buffer: Uint8Array) {
        // new plan
        // have conditional that sends host info before hello message (all in the same message)
        // maybe something that checks if the message is a hello and then sends the host info before the hello is sent (that could be a new method)

        //parameter which contains info about socket
        //where multiplexing happens
        // addbuffer();
        //bson has uuid class
        //or have a counter that starts at 1
        //every single message that system sends will have unique identifier
        console.log("sending message using send function");
        this.socket.send(buffer);
    }
}
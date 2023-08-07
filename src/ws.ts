import { TestSocketInstance } from "../test/test_socket_instance";

const WebSocket = isBrowser() ? globalThis.WebSocket : TestSocketInstance;

function isBrowser() {
    if ((typeof process === "object" && process.title === 'node') || (typeof importScripts === "function")) {
        return false;
    }
    if ((typeof window === "object")) {
        return true;
    }
}

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

export class SocketWrapper {
    socketMode: string;
    socket: WebSocket | TestSocketInstance;
    messages: Array<Uint8Array> = [];
    notify: ReturnType<typeof makeNotifier<void>>;
    url: string;
    currError: boolean;
    opened: ReturnType<typeof makeNotifier<void>>;

    constructor({ host = 'localhost', port = 9080 } = {}) {
        this.url = `ws://${host}:${port}/ws`;
        this.socket = new WebSocket(this.url);
        this.socket.addEventListener('close', () => this.#onClose());
        this.socket.addEventListener('error', error => this.#onError(error));
        this.socket.addEventListener('message', message => this.#onMessage(message));
        this.socket.addEventListener('open', () => this.#onOpen());
        this.socketMode = isBrowser()? "browser" : "test";
        this.socket.binaryType = 'arraybuffer';
        this.notify = makeNotifier<void>();
        this.currError = false;
        this.opened = makeNotifier<void>();
    }

    #onClose() {
        console.log('SocketWrapper: #onClose()');
        this.opened = makeNotifier<void>();
    }
    #onError(error) {
        console.log('SocketWrapper: #onError()');
        this.currError = true;
    }
    #onMessage(message: { data: ArrayBuffer }) {
        console.log('SocketWrapper: #onMessage()');
        this.messages.push(new Uint8Array(message.data))
        this.notify.resolve();
    }
    #onOpen() {
        console.log('SocketWrapper: #onOpen()');
        this.opened.resolve();
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

    async send(buffer: Uint8Array) {
        if (this.socketMode == 'browser') {
            await this.opened.p;
        }
        this.socket.send(buffer);
    }
}
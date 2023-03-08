function makeNotifier<T>(): {p: Promise<T>, resolve: (value: T) => void; reject: (reason?: Error) => void } {
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
        this.socket = new WebSocket(`ws://${host}:${port}/ws`);
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
    #onMessage(message: MessageEvent<ArrayBuffer>) {
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
        while(this.messages.length) {
            const value = this.messages.shift();
            if (value) {
                yield value
            }
            await this.notify.p;
            this.notify = makeNotifier();
        }
        throw new Error('socket had no messages after notify.resolve() was called')
    }

    send(buffer: Uint8Array) {
        this.socket.send(buffer);
    }
}
